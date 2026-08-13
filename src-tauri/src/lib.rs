use tauri::{Manager, WindowEvent};

use crate::state::AppState;

mod bindings;
mod commands;
mod state;
mod types;
mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        log::error!("Application panicked: {:?}", info);
    }));

    let builder = bindings::generate_bindings();

    // Export TypeScript bindings in debug builds
    #[cfg(debug_assertions)]
    bindings::export_ts_bindings();

    // Build with common plugins
    let mut app_builder = tauri::Builder::default().plugin(
        tauri_plugin_log::Builder::new()
            .level(tauri_plugin_log::log::LevelFilter::Trace)
            .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(10))
            .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
            .format(|out, message, record| {
                out.finish(format_args!(
                    "{} [{:<5}] {}",
                    chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f"),
                    record.level(),
                    message
                ));
            })
            .build(),
    );

    app_builder = app_builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    app_builder
        .setup(|_app| {
            log::info!("app start");
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                log::info!("app closing");
            }
        })
        .manage(AppState::new())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
