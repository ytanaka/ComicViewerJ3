use tauri::AppHandle;

#[tauri::command]
#[specta::specta]
/// アプリ終了
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}
