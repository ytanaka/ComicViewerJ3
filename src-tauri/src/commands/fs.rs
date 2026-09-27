use std::{fs, sync::Arc};

use anyhow::anyhow;
use tauri::State;

use crate::{
    commands::fs_util::{is_valid_filename, parse_file_id_str},
    state::app_state::AppState,
    types::{FileOpResult, TabId},
    LOG_RESULT,
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 新規ファイル
pub async fn create_file(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    name: String,
) -> Result<FileOpResult, String> {
    LOG_RESULT!(format!("create_file({}, {})", tab_id, name), {
        create_file_impl(state, tab_id, name)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn create_file_impl(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    name: String,
) -> anyhow::Result<FileOpResult> {
    if !is_valid_filename(&name) {
        return Ok(FileOpResult::InvalidFilename);
    }

    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();
    let to = tab.get_path().join(&name);

    // Path::exists, try_exists だと壊れたシンボリックリンクは存在しないとみなすので Path::symlink_metadata を使う
    if to.symlink_metadata().is_ok() {
        return Ok(FileOpResult::AlreadyExists);
    }

    fs::File::create_new(to)?;

    Ok(FileOpResult::Success)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 新規ディレクトリ
pub async fn create_directory(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    name: String,
) -> Result<FileOpResult, String> {
    LOG_RESULT!(format!("create_directory({}, {})", tab_id, name), {
        create_directory_impl(state, tab_id, name)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn create_directory_impl(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    name: String,
) -> anyhow::Result<FileOpResult> {
    if !is_valid_filename(&name) {
        return Ok(FileOpResult::InvalidFilename);
    }

    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();
    let to = tab.get_path().join(&name);

    // Path::exists, try_exists だと壊れたシンボリックリンクは存在しないとみなすので Path::symlink_metadata を使う
    if to.symlink_metadata().is_ok() {
        return Ok(FileOpResult::AlreadyExists);
    }

    fs::create_dir(to)?;

    Ok(FileOpResult::Success)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// リネーム
pub async fn rename_file(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_id: String,
    name: String,
) -> Result<FileOpResult, String> {
    LOG_RESULT!(format!("rename_file({}, {}, {})", tab_id, file_id, name), {
        rename_file_impl(state, tab_id, &file_id, name)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn rename_file_impl(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_id: &str,
    name: String,
) -> anyhow::Result<FileOpResult> {
    if !is_valid_filename(&name) {
        return Ok(FileOpResult::InvalidFilename);
    }

    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();
    let file_id = parse_file_id_str(file_id)?;
    let from = tab.get_file_info(file_id)?;
    let from = tab.get_path().join(&*from.name);
    let to = tab.get_path().join(&name);

    // Path::exists, try_exists だと壊れたシンボリックリンクは存在しないとみなすので Path::symlink_metadata を使う
    if to.symlink_metadata().is_ok() {
        return Ok(FileOpResult::AlreadyExists);
    }

    fs::rename(from, to)?;

    Ok(FileOpResult::Success)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 削除
pub async fn remove_files(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: Vec<String>,
) -> Result<(), String> {
    LOG_RESULT!(format!("rename_file({}, [{}])", tab_id, file_ids.len()), {
        remove_files_impl(state, tab_id, &file_ids)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn remove_files_impl(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: &Vec<String>,
) -> anyhow::Result<()> {
    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();

    todo!();
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 削除、コピー、移動の準備
pub async fn prepare_file_op(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: Vec<String>,
) -> Result<(), String> {
    LOG_RESULT!(format!("rename_file({}, [{}])", tab_id, file_ids.len()), {
        prepare_file_op_impl(state, tab_id, &file_ids)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn prepare_file_op_impl(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: &Vec<String>,
) -> anyhow::Result<()> {
    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();

    todo!();
}
