use tauri::{AppHandle, State};

use crate::state::app_state::AppState;

#[tauri::command]
#[specta::specta]
/// Rust側の初期化 (ほかのコマンドを使用する前に呼ぶ)
pub fn init(state: State<'_, AppState>) {
    log::info!("command::init() start");
    state.init(&state);
    log::info!("command::init() end");
}

#[tauri::command]
#[specta::specta]
/// アプリ終了
pub fn exit_app(app: AppHandle) {
    log::info!("command::exit_app()");
    app.exit(0);
}
