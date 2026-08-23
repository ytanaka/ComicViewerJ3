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
    LOG_RESULT, state::{AppState, TabInfo}, types::{DirEntry, FileId, FileInfo, FileInfoOs, SortType, TabId},
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 新規タブ作成
pub fn create_tab(state: State<'_, AppState>) -> TabId {
    create_tab_imp(&state)
}
fn create_tab_imp(state: &AppState) -> TabId {
    let tab_id = state.next_tab_id.fetch_add(1, SeqCst);
    state
        .tabs
        .insert(tab_id, Arc::new(RwLock::new(TabInfo::new(tab_id))));
    log::trace!("create_tab() => {tab_id}");
    tab_id
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// タブ削除
pub fn remove_tab(state: State<'_, AppState>, tab_id: TabId) -> Result<(), String> {
    LOG_RESULT!(format!("remove_tab({tab_id})"), {
        remove_tab_impl(&state, tab_id)
    })
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
/// タブ一覧
pub fn get_tab_ids(state: State<'_, AppState>) -> Vec<TabId> {
    get_tab_ids_impl(&state)
}
pub fn get_tab_ids_impl(state: &AppState) -> Vec<TabId> {
    state.get_tab_ids()
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ディレクトリ中のファイル一覧を読み込む
pub fn read_dir_entries(
    state: State<'_, AppState>,
    tab_id: TabId,
    path: String,
) -> Result<Vec<DirEntry>, String> {
    LOG_RESULT!(format!("read_dir_entries({}, {})", tab_id, path), {
        read_dir_entries_impl(&state, tab_id, path).map_err(|e| e.to_string())
    })
}
fn read_dir_entries_impl(
    state: &AppState,
    tab_id: TabId,
    path: String,
) -> anyhow::Result<Vec<DirEntry>> {
    // path 存在確認
    let path = Path::new(&path);
    if !path.is_dir() {
        Err(io::Error::new(
            ErrorKind::NotADirectory,
            path.to_string_lossy(),
        ))?
    }

    // tab_id 存在確認
    let tab = state
        .tabs
        .get_mut(&tab_id)
        .ok_or_else(|| anyhow!("invalid tab_id: {tab_id}"))?;

    let mut tab = tab.write().unwrap();
    let list = read_dir_entries_impl2(&mut tab, path)?;
    tab.set_files(path.to_path_buf(), list);
    Ok(tab.get_dir_entries())
}
fn read_dir_entries_impl2(
    tab: &mut TabInfo,
    path: &Path,
) -> anyhow::Result<HashMap<FileId, FileInfoOs>> {
    let mut ret = HashMap::<FileId, FileInfoOs>::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let info = FileInfoOs {
            name: entry.file_name(),
            metadata: None,
        };
        ret.insert(tab.inc_file_id(), info);
    }
    Ok(ret)
}

// ---------------------------------------------------------------------------------------------------------------------
/// ファイル情報取得
// ※ id は u64 にしたかったが、tauri_specta でエラーになるので文字列にする
#[tauri::command]
#[specta::specta]
pub fn get_file_info(
    state: State<'_, AppState>,
    tab_id: TabId,
    file_id: &str,
) -> Result<FileInfo, String> {
    LOG_RESULT!(format!("get_file_info({tab_id}, {file_id})"), {
        get_file_info_impl(&state, tab_id, file_id)
    })
}
fn get_file_info_impl(state: &AppState, tab_id: TabId, file_id: &str) -> Result<FileInfo, String> {
    match state.tabs.get_mut(&tab_id) {
        None => Err(format!("invalid tab_id: {tab_id}"))?,
        Some(tab) => {
            let mut tab = tab.write().unwrap();
            let file_id: u64 = file_id.parse().map_err(|_| "invalid file_id")?;
            Ok(tab.get_file_info(file_id).map(|f|f.to_js()) ?)
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
/// ファイル一覧取得 (ソート後やファイル状態が更新された後で呼ぶ)
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
    use std::ffi::OsString;

    use super::*;

    #[test]
    fn test_create_tab_remove_tab() {
        let state = AppState::new();
        assert_eq!(state.tabs.len(), 0);

        assert_eq!(1, create_tab_imp(&state));
        assert_eq!(state.tabs.len(), 1);
        assert_eq!(2, create_tab_imp(&state));

        assert_eq!(state.get_tab_ids(), vec![1, 2]);
        assert_eq!(remove_tab_impl(&state, 99), Err("no tab: 99".to_string()));

        assert_eq!(remove_tab_impl(&state, 1), Ok(()));
        assert_eq!(remove_tab_impl(&state, 1), Err("no tab: 1".to_string()));
        assert_eq!(remove_tab_impl(&state, 2), Ok(()));

        assert_eq!(state.tabs.len(), 0);
        assert_eq!(state.next_tab_id.load(SeqCst), 3);
    }

    #[test]
    fn test_read_dir_entries() {
        let state = AppState::new();
        let tab_id = create_tab_imp(&state);
        let ret = read_dir_entries_impl(&state, tab_id, "./testdata".to_string()).unwrap();

        assert_eq!(ret.len(), 4);
        assert_eq!(ret[0].name, "d1");
        assert_eq!(ret[1].name, "d2");
        assert_eq!(ret[2].name, "d3");
        assert_eq!(ret[3].name, "fff.txt");

        let ret = read_dir_entries_impl(&state, tab_id, "./testdata/d2".to_string()).unwrap();
        assert_eq!(ret.len(), 2);
        assert_eq!(ret[0].name, "f2-1.txt");
        assert_eq!(ret[1].name, "f2-2.txt");
    }

    #[test]
    fn test_get_file_info() {
        let state = AppState::new();
        assert_eq!(
            get_file_info_impl(&state, 0, ""),
            Err("invalid tab_id: 0".to_string())
        );
        let tab_id = create_tab_imp(&state);
        assert_eq!(
            get_file_info_impl(&state, tab_id, "0"),
            Err("not initialized tab: 1".to_string())
        );

        // ディレクトリ読み込み
        let dir_entries =
            read_dir_entries_impl(&state, tab_id, "./testdata/d3".to_string()).unwrap();

        assert_eq!(
            get_file_info_impl(&state, tab_id, ""),
            Err("invalid file_id".to_string())
        );
        assert_eq!(
            get_file_info_impl(&state, tab_id, " 1"),
            Err("invalid file_id".to_string())
        );
        assert_eq!(
            get_file_info_impl(&state, tab_id, "1 "),
            Err("invalid file_id".to_string())
        );
        assert_eq!(
            get_file_info_impl(&state, tab_id, "１"),
            Err("invalid file_id".to_string())
        );

        assert_eq!(
            get_file_info_impl(&state, tab_id, "99999"),
            Err("invalid file_id: 99999 for tab_id[1]".to_string())
        );

        // f3-1.txt
        let finfo = get_file_info_impl(&state, tab_id, &format!("{}", dir_entries[0].id)).unwrap();
        assert_eq!(finfo.name, String::from("f3-1.txt"));
        assert_eq!(finfo.metadata.as_ref().unwrap().is_dir, false);
        assert_eq!(finfo.metadata.as_ref().unwrap().size, Some(1));
        // f3-3.txt
        let finfo = get_file_info_impl(&state, tab_id, &format!("{}", dir_entries[2].id)).unwrap();
        assert_eq!(finfo.name, String::from("f3-3.txt"));
        assert_eq!(finfo.metadata.as_ref().unwrap().is_dir, false);
        assert_eq!(finfo.metadata.as_ref().unwrap().size, Some(3));
        // xxx (空ディレクトリ)
        let finfo = get_file_info_impl(&state, tab_id, &format!("{}", dir_entries[3].id)).unwrap();
        assert_eq!(finfo.name, String::from("xxx"));
        assert_eq!(finfo.metadata.as_ref().unwrap().is_dir, true);
        assert_eq!(finfo.metadata.as_ref().unwrap().size, Some(0));
    }
}
