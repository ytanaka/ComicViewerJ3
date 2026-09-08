use std::{path::PathBuf, sync::Arc};

use anyhow::{anyhow, Context};
use tauri::{AppHandle, Manager, State};

use crate::{state::app_state::AppState, types::AppPreferences, LOG_RESULT};

// ---------------------------------------------------------------------------------------------------------------------
/// 設定JSONファイルのフルパスを取得
fn get_preferences_path(app: &AppHandle) -> anyhow::Result<PathBuf> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .context("Failed to get app data directory")?;
    std::fs::create_dir_all(&app_data_dir).context("Failed to create app data directory")?;
    Ok(app_data_dir.join("preferences.json"))
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 設定取得
pub async fn load_preferences(app: AppHandle) -> Result<AppPreferences, String> {
    LOG_RESULT!("load_preferences()", {
        load_preferences_impl(app).map_err(|e| e.to_string())
    })
}
pub fn load_preferences_impl(app: AppHandle) -> anyhow::Result<AppPreferences> {
    let default = Ok(AppPreferences::default());
    let prefs_path = get_preferences_path(&app)?;

    // ファイル存在チェック (存在しない場合はデフォルトを返す)
    if !prefs_path.exists() {
        return default;
    }

    // JSONファイルから読み込み (読めない場合はデフォルトを返す)
    let pref: AppPreferences = match std::fs::read_to_string(&prefs_path) {
        Err(_) => return default,
        Ok(json_str) => match serde_json::from_str(&json_str) {
            Err(_) => return default,
            Ok(json) => json,
        },
    };

    Ok(pref)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 設定保存
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
) -> anyhow::Result<()> {
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
    let mut pref = state.preferences.write().unwrap();
    *pref = preferences;

    Ok(())
}
