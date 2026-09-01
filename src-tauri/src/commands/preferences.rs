use std::{path::PathBuf, sync::Arc};

use anyhow::{anyhow, Context, Result};
use tauri::{AppHandle, Manager, State};

use crate::{state::app_state::AppState, types::AppPreferences, LOG_RESULT};

fn get_preferences_path(app: &AppHandle) -> Result<PathBuf> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .context("Failed to get app data directory")?;
    std::fs::create_dir_all(&app_data_dir).context("Failed to create app data directory")?;
    Ok(app_data_dir.join("preferences.json"))
}

#[tauri::command]
#[specta::specta]
pub async fn load_preferences(state: State<'_, Arc<AppState>>) -> Result<AppPreferences, String> {
    log::trace!("load_preferences()");
    let pref = state.get_preferences_read();
    Ok(pref.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn save_preferences(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    preferences: AppPreferences,
) -> Result<(), String> {
    LOG_RESULT!("save_preferences()", {
        save_preferences_impl(app, state, preferences).map_err(|e| e.to_string())
    })
}
pub fn save_preferences_impl(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    preferences: AppPreferences,
) -> Result<()> {
    let prefs_path = get_preferences_path(&app)?;
    let json_content =
        serde_json::to_string_pretty(&preferences).context("Failed to serialize preferences")?;

    // 一時ファイルに書き込み
    let temp_path = prefs_path.with_extension("tmp");
    std::fs::write(&temp_path, json_content).context("Failed to write preferences file")?;
    // 一時ファイルをリネーム
    if let Err(e) = std::fs::rename(&temp_path, &prefs_path) {
        if let Err(e) = std::fs::remove_file(&temp_path) {
            log::warn!("save_preferences(): Failed to remove temp file after rename failure: {e}");
        }
        return Err(anyhow!("Failed to finalize preferences file: {e}"));
    }

    // メモリ中の設定を更新
    let mut pref = state.get_preferences_write();
    *pref = preferences;

    Ok(())
}
