use tauri::{AppHandle, State};

use crate::state::app_state::AppState;

#[tauri::command]
#[specta::specta]
pub fn init(state: State<'_, AppState>) {
    state.init(&state);
}

#[tauri::command]
#[specta::specta]
/// アプリ終了
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}
