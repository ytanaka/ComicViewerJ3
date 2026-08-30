use std::sync::Arc;

use tauri::{AppHandle, State};

use crate::state::app_state::AppState;

#[tauri::command]
#[specta::specta]
/// Rust側の初期化 (ほかのコマンドを使用する前に呼ぶ)
pub async fn init(state: State<'_, Arc<AppState>>) -> Result<(), String> {
    // let state2 = Arc::clone(&state);
    let state2 = state.inner().clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        log::info!("command::init() start");
        state2.init();
        log::info!("command::init() end");
    });
    Ok(result.await.unwrap())
}

#[tauri::command]
#[specta::specta]
/// アプリ終了
pub fn exit_app(app: AppHandle) {
    log::info!("command::exit_app()");
    app.exit(0);
}
