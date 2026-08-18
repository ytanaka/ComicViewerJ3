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
    create_tab_imp(&state)
}
fn create_tab_imp(state: &AppState) -> TabId {
    let tab_id = state.next_tab_id.fetch_add(1, SeqCst);
    state
        .tabs
        .insert(tab_id, Arc::new(RwLock::new(TabInfo::new(tab_id))));
    tab_id
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn remove_tab(state: State<'_, AppState>, tab_id: TabId) -> Result<(), String> {
    remove_tab_impl(&state, tab_id)
}
pub fn remove_tab_impl(state: &AppState, tab_id: TabId) -> Result<(), String> {
    match state.tabs.remove(&tab_id) {
        None => Err(format!("no tab: {tab_id}")),
        Some(_kv) => Ok(()),
    }
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn read_dir_entries(
    state: State<'_, AppState>,
    tab_id: TabId,
    path: String,
) -> Result<Vec<DirEntry>, String> {
    read_dir_entries_impl(&state, tab_id, path).map_err(|e| e.to_string())
}
fn read_dir_entries_impl(
    state: &AppState,
    tab_id: TabId,
    path: String,
) -> anyhow::Result<Vec<DirEntry>> {
    log::trace!("read_dir_entries({tab_id}, {path})");
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
        println!("entry: {entry:?}");
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
    get_file_info_impl(&state, tab_id, file_id)
}
fn get_file_info_impl(state: &AppState, tab_id: TabId, file_id: &str) -> Result<FileInfo, String> {
    log::trace!("get_file_info({tab_id}, {file_id})");
    match state.tabs.get_mut(&tab_id) {
        None => Err(format!("invalid tab_id: {tab_id}"))?,
        Some(tab) => {
            let mut tab = tab.write().unwrap();
            Ok(tab.get_file_info(try_u64(file_id)?)?)
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ファイル一覧をソートする
pub fn sort_files(_state: State<'_, AppState>, _tab_id: TabId, _sort_type: SortType) -> bool {
    todo!("")
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn get_dir_entries(
    _state: State<'_, AppState>,
    _tab_id: TabId,
) -> Result<Vec<DirEntry>, String> {
    todo!("")
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_tab_remove_tab() {
        let state = AppState::new();
        assert_eq!(state.tabs.len(), 0);
        assert_eq!(state.next_tab_id.load(SeqCst), 0);

        assert_eq!(0, create_tab_imp(&state));
        assert_eq!(state.tabs.len(), 1);
        assert_eq!(1, create_tab_imp(&state));

        assert_eq!(state.tabs.len(), 2);
        assert_eq!(remove_tab_impl(&state, 99), Err("no tab: 99".to_string()));

        assert_eq!(remove_tab_impl(&state, 0), Ok(()));
        assert_eq!(remove_tab_impl(&state, 0), Err("no tab: 0".to_string()));
        assert_eq!(remove_tab_impl(&state, 1), Ok(()));

        assert_eq!(state.tabs.len(), 0);
        assert_eq!(state.next_tab_id.load(SeqCst), 2);
    }

    #[test]
    fn test_read_dir_entries() {
        let state = AppState::new();
        assert_eq!(0, create_tab_imp(&state));
    }
}
