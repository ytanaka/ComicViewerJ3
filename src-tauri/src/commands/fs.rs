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
    state::{app_state::AppState, tab_info::TabInfo},
    types::{DirEntryUI, FileId, FileInfoOS, FileInfoUI, SortCondition, TabId},
    LOG_RESULT,
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 新規タブ作成
pub fn create_tab(state: State<'_, Arc<AppState>>) -> TabId {
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
pub fn remove_tab(state: State<'_, Arc<AppState>>, tab_id: TabId) -> Result<(), String> {
    LOG_RESULT!(format!("remove_tab({tab_id})"), {
        remove_tab_impl(&state, tab_id)
    })
}
fn remove_tab_impl(state: &AppState, tab_id: TabId) -> Result<(), String> {
    match state.tabs.remove(&tab_id) {
        None => Err(format!("no tab: {tab_id}")),
        Some(_kv) => Ok(()),
    }
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// タブ一覧
pub fn get_tab_ids(state: State<'_, Arc<AppState>>) -> Vec<TabId> {
    log::trace!("get_tab_ids()");
    get_tab_ids_impl(&state)
}
fn get_tab_ids_impl(state: &AppState) -> Vec<TabId> {
    state.get_tab_ids()
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ディレクトリ中のファイル一覧を読み込む
pub fn read_dir_entries(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    path: String,
) -> Result<Vec<DirEntryUI>, String> {
    LOG_RESULT!(format!("read_dir_entries({}, {})", tab_id, path), {
        read_dir_entries_impl(&state, tab_id, path).map_err(|e| e.to_string())
    })
}
fn read_dir_entries_impl(
    state: &AppState,
    tab_id: TabId,
    path: String,
) -> anyhow::Result<Vec<DirEntryUI>> {
    // path 存在確認
    let path = Path::new(&path);
    if !path.is_dir() {
        Err(io::Error::new(
            ErrorKind::NotADirectory,
            path.to_string_lossy(),
        ))?
    }

    // タブにファイル一覧を読み込む
    let tab = state.get_tab(tab_id)?;
    let mut tab = tab.write().unwrap();
    let list = read_dir_entries_impl2(state, path)?;
    tab.set_files(path.to_path_buf(), list);
    let ret = tab.create_dir_entries();

    if state.is_initialized() {
        // 形態素解析する
        let names: Vec<_> = ret.iter().map(|f| f.name.clone()).collect();
        state.text_matcher.send_to_worker(&tab, names);

        // メタデータを読み込む
        let file_ids: Vec<_> = ret.iter().map(|f| f.file_id).collect();
        state.metadata_worker.send_to_worker(&tab, file_ids);
    }

    Ok(ret)
}
fn read_dir_entries_impl2(
    state: &AppState,
    path: &Path,
) -> anyhow::Result<HashMap<FileId, FileInfoOS>> {
    let mut ret = HashMap::<FileId, FileInfoOS>::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let info = FileInfoOS {
            name: Arc::from(entry.file_name()),
            is_dir: entry.file_type()?.is_dir(),
            metadata: None,
        };
        ret.insert(state.next_file_id.fetch_add(1, SeqCst), info);
    }
    Ok(ret)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ファイル情報まとめて取得
// ※ id は u64 にしたかったが、tauri_specta でエラーになるので文字列にする
pub async fn get_file_infos(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: Vec<String>,
) -> Result<Vec<FileInfoUI>, String> {
    let mut arg: String = "".to_string();
    if file_ids.len() != 0 {
        arg = format!(
            "{}:{}-{}",
            file_ids.len(),
            file_ids[0],
            file_ids[file_ids.len() - 1]
        );
    }
    log::trace!("get_file_infos({}, [{}]) start", tab_id, arg);
    get_file_infos_impl(&state, tab_id, file_ids)
        .await
        .map_err(|e| e.to_string())
}
pub async fn get_file_infos_impl(
    state: &AppState,
    tab_id: TabId,
    file_ids: Vec<String>,
) -> anyhow::Result<Vec<FileInfoUI>> {
    let tab = state.get_tab(tab_id)?;
    let mut tab = tab.write().unwrap();
    let mut ret = Vec::new();
    for s in file_ids {
        let file_id: u64 = s.parse().map_err(|_| anyhow!("invalid file_id"))?;
        let file_info = tab.fill_metadata_to_file_info(file_id)?;
        ret.push(file_info.to_ui()?);
    }
    Ok(ret)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ファイル一覧をソートする (まだソートできない場合は false を返す)
pub fn sort_files(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    sort_condition: SortCondition,
) -> Result<bool, String> {
    LOG_RESULT!(format!("sort_files({tab_id}, ...)"), {
        sort_files_impl(&state, tab_id, sort_condition)
    })
}
pub fn sort_files_impl(
    state: &AppState,
    tab_id: TabId,
    sort_condition: SortCondition,
) -> anyhow::Result<bool, String> {
    let tab = state.get_tab(tab_id).map_err(|e| e.to_string())?;
    let mut tab = tab.write().unwrap();
    if !tab.sortable(&sort_condition) {
        return Ok(false);
    }
    tab.sort_items(sort_condition);
    Ok(true)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ファイル一覧取得 (ソート後やファイル状態が更新された後で呼ぶ)
pub fn get_dir_entries(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
) -> Result<Vec<DirEntryUI>, String> {
    LOG_RESULT!(format!("get_dir_entries({tab_id})"), {
        get_dir_entries_impl(&state, tab_id)
    })
}
pub fn get_dir_entries_impl(
    state: &Arc<AppState>,
    tab_id: TabId,
) -> Result<Vec<DirEntryUI>, String> {
    let tab = state.get_tab(tab_id).map_err(|e| e.to_string())?;
    let mut tab = tab.write().unwrap();
    Ok(tab.create_dir_entries())
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
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

        assert_eq!(ret[0].name, Arc::from("d1"));
        assert_eq!(ret[1].name, Arc::from("d2"));
        assert_eq!(ret[2].name, Arc::from("d3"));
        assert_eq!(ret[3].name, Arc::from("fff.txt"));

        assert_eq!(ret[0].is_dir, true);
        assert_eq!(ret[1].is_dir, true);
        assert_eq!(ret[2].is_dir, true);
        assert_eq!(ret[3].is_dir, false);

        let ret = read_dir_entries_impl(&state, tab_id, "./testdata/d2".to_string()).unwrap();
        assert_eq!(ret.len(), 2);
        assert_eq!(ret[0].name, Arc::from("f2-1.txt"));
        assert_eq!(ret[1].name, Arc::from("f2-2.txt"));
    }

    #[tokio::test]
    async fn test_get_file_infos() {
        let state = AppState::new();
        let f = async |tab_id: TabId, file_id: &str| {
            get_file_infos_impl(&state, tab_id, vec![file_id.to_string()])
                .await
                .map_err(|e| e.to_string())
        };
        // タブを作る前はエラー
        assert_eq!(f(0, "").await, Err("invalid tab_id: 0".to_string()));

        let tab_id = create_tab_imp(&state);
        // タブが初期化される前はエラー
        assert_eq!(
            f(tab_id, "0").await,
            Err("not initialized tab: 1".to_string())
        );

        // 不正なファイルIDを渡すとエラー
        assert_eq!(f(tab_id, "").await, Err("invalid file_id".to_string()));
        assert_eq!(f(tab_id, " 1").await, Err("invalid file_id".to_string()));
        assert_eq!(f(tab_id, "1 ").await, Err("invalid file_id".to_string()));
        assert_eq!(f(tab_id, "１").await, Err("invalid file_id".to_string()));

        // ディレクトリ読み込み
        let dir_entries =
            read_dir_entries_impl(&state, tab_id, "./testdata/d3".to_string()).unwrap();

        // 存在しないファイルIDを渡すとエラー
        assert_eq!(
            f(tab_id, "99999").await,
            Err("invalid file_id: 99999 for tab_id[1]".to_string())
        );

        let f = async |tab_id: TabId, file_id: FileId| {
            get_file_infos_impl(&state, tab_id, vec![file_id.to_string()])
                .await
                .map_err(|e| e.to_string())
                .map(|v| v.into_iter().next().unwrap())
        };

        // f3-1.txt
        let finfo = f(tab_id, dir_entries[0].file_id).await.unwrap();
        assert_eq!(finfo.metadata.as_ref().right().unwrap().size, Some(1));
        // f3-3.txt
        let finfo = f(tab_id, dir_entries[2].file_id).await.unwrap();
        assert_eq!(finfo.metadata.as_ref().right().unwrap().size, Some(3));
        // xxx (空ディレクトリ)
        let finfo = f(tab_id, dir_entries[3].file_id).await.unwrap();
        assert_eq!(finfo.metadata.as_ref().right().unwrap().size, Some(0));
    }
}
