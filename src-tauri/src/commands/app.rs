use tauri::AppHandle;

#[tauri::command]
#[specta::specta]
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}
