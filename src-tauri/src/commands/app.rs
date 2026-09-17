use std::sync::Arc;

use tauri::{AppHandle, State, Window};

use crate::{state::app_state::AppState, types::FileNotifyEvent};

#[tauri::command]
#[specta::specta]
/// Rust側の初期化 (ほかのコマンドを使用する前に呼ぶ)
pub async fn init(app: AppHandle, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    let state2 = state.inner().clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        log::info!("command::init() start");
        state2.init(&app, state2.clone());
        log::info!("command::init() end");
    });
    result.await.unwrap();
    Ok(())
}

#[tauri::command]
#[specta::specta]
/// アプリ終了
pub fn exit_app(app: AppHandle, state: State<'_, Arc<AppState>>) {
    log::info!("command::exit_app()");
    state.stop();
    app.exit(0);
}

#[tauri::command]
#[specta::specta]
/// フルスクリーン
pub fn set_fullscreen(window: Window, fullscreen: bool) {
    let _ = window.set_fullscreen(fullscreen);
}

#[tauri::command]
#[specta::specta]
/// ダミー
pub fn dummy(_file_notify: FileNotifyEvent) {
    log::info!("command::dummy()");
}
