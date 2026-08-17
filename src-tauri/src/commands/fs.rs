use std::{
    collections::HashMap,
    fs::{self},
    io::{self, ErrorKind},
    path::Path,
    sync::{atomic::Ordering::SeqCst, Arc, RwLock},
};

use anyhow::anyhow;
use tauri::State;

use crate::{
    state::{AppState, TabInfo},
    types::{DirEntry, FileId, FileInfo, SortType, TabId},
    util::try_u64,
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn create_tab(state: State<'_, AppState>) -> TabId {
    let tab_id = state.next_tab_id.fetch_add(1, SeqCst);
    state
        .tabs
        .insert(tab_id, Arc::new(RwLock::new(TabInfo::new(tab_id))));
    tab_id
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn remove_tab(state: State<'_, AppState>, tab_id: TabId) {
    todo!("")
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn read_dir_entries(
    state: State<'_, AppState>,
    tab_id: TabId,
    path: String,
) -> Result<Vec<DirEntry>, String> {
    log::trace!("read_dir_entries({path})");
    read_dir_entries_impl(&state, tab_id, path).map_err(|e| e.to_string())
}
fn read_dir_entries_impl(
    state: &State<'_, AppState>,
    tab_id: TabId,
    path: String,
) -> anyhow::Result<Vec<DirEntry>> {
    let path = Path::new(&path);
    if !path.is_dir() {
        Err(io::Error::new(
            ErrorKind::NotADirectory,
            path.to_string_lossy(),
        ))?
    }

    match state.tabs.get_mut(&tab_id) {
        None => return Err(anyhow!("invalid tab_id: ${tab_id}")),
        Some(tab) => {
            let mut tab = tab.write().unwrap();
            let list = read_dir_entries_impl2(path, &mut tab)?;
            tab.set_files(path.to_path_buf(), list);
            Ok(tab.get_dir_entries())
        }
    }
}
fn read_dir_entries_impl2(
    path: &Path,
    tab: &mut TabInfo,
) -> anyhow::Result<HashMap<FileId, FileInfo>> {
    let mut ret = HashMap::<FileId, FileInfo>::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let info = FileInfo {
            name: entry.file_name(),
            metadata: None,
        };
        ret.insert(tab.next_file_id, info);
        tab.next_file_id += 1;
    }
    Ok(ret)
}

// ---------------------------------------------------------------------------------------------------------------------
// id は u64 にしたかったが、tauri_specta でエラーになるので文字列にする
#[tauri::command]
#[specta::specta]
pub fn get_file_info(
    state: State<'_, AppState>,
    tab_id: TabId,
    file_id: &str,
) -> Result<FileInfo, String> {
    log::trace!("get_file_info(${tab_id}, ${file_id})");

    match state.tabs.get_mut(&tab_id) {
        None => Err(format!("invalid tab_id: ${tab_id}"))?,
        Some(tab) => {
            let mut tab = tab.write().unwrap();
            Ok(tab.get_file_info(try_u64(file_id)?)?)
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn sort(state: State<'_, AppState>, tab_id: TabId, sort_type: SortType) -> bool {
    todo!("")
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn get_dir_entries(state: State<'_, AppState>, tab_id: TabId) -> Result<Vec<DirEntry>, String> {
    todo!("")
}
