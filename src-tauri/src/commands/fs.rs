use std::{
    collections::HashMap,
    path::Path,
    sync::{atomic::Ordering::SeqCst, Arc, RwLock},
};

use anyhow::anyhow;
use tauri::State;

use crate::{
    commands::fs_util,
    file_operations::file_utils,
    state::{app_state::AppState, tab_info::TabInfo},
    types::{DirEntryUI, FileInfoUI, SortCondition, TabId, TabInfoUI},
    LOG_RESULT,
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// タブ作成 (絶対パス)
pub async fn create_tab(
    state: State<'_, Arc<AppState>>,
    path: String,
) -> Result<TabInfoUI, String> {
    LOG_RESULT!(format!("create_tab({path}"), {
        create_tab_imp(&state, path)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn create_tab_imp(state: &AppState, arg_path: impl AsRef<Path>) -> anyhow::Result<TabInfoUI> {
    // ディレクトリチェック
    let arg_path = arg_path.as_ref().to_path_buf();
    if !arg_path.is_absolute() {
        return Err(anyhow!("not absolute. path:{arg_path:?}"));
    }
    let mut path = arg_path.clone();
    loop {
        // ディレクトリでないなら、勝手に親に移動する
        if path.is_dir() {
            break;
        }
        path = path
            .parent()
            .ok_or_else(|| anyhow!("not directory. path:{arg_path:?}"))?
            .to_path_buf();
    }

    // ファイル一覧取得
    let mut files_map = HashMap::new();
    for f in file_utils::read_dir(&path)? {
        let id = state.next_file_id.fetch_add(1, SeqCst);
        files_map.insert(id, f);
    }
    let names: Vec<_> = files_map.values().map(|v| v.name.clone()).collect();
    let file_ids: Vec<_> = files_map.keys().copied().collect();

    // タブ作成
    let tab_id = state.next_tab_id.fetch_add(1, SeqCst);
    let tab = TabInfo::new(tab_id, path, files_map);

    if state.is_initialized() {
        // 形態素解析する
        state.text_matcher.send_to_worker(&tab, names);
        // メタデータを読み込む
        state.metadata_worker.send_to_worker(&tab, file_ids);
    }

    // AppState に追加
    let tab_ui = tab.to_ui();
    state.tabs.insert(tab_id, Arc::new(RwLock::new(tab)));

    Ok(tab_ui)
}

// ---------------------------------------------------------------------------------------------------------------------
/// タブ作成 (指定タブと同じパス)
#[tauri::command]
#[specta::specta]
pub async fn clone_tab(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
) -> Result<TabInfoUI, String> {
    LOG_RESULT!(format!("clone_tab({tab_id})"), {
        clone_tab_impl(&state, tab_id)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn clone_tab_impl(state: &AppState, tab_id: TabId) -> anyhow::Result<TabInfoUI> {
    let path = fs_util::get_tab_path(state, tab_id)?;
    create_tab_imp(state, path).await
}

// ---------------------------------------------------------------------------------------------------------------------
/// タブ作成 (指定タブの子ディレクトリ)
#[tauri::command]
#[specta::specta]
pub async fn clone_tab_child_dir(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_id: String,
) -> Result<TabInfoUI, String> {
    LOG_RESULT!(format!("clone_tab_child_dir({tab_id}, {file_id})"), {
        clone_tab_child_dir_impl(&state, tab_id, file_id)
            .await
            .map_err(|e| e.to_string())
    })
}

async fn clone_tab_child_dir_impl(
    state: &AppState,
    tab_id: TabId,
    file_id: String,
) -> anyhow::Result<TabInfoUI> {
    let file_id: u64 = file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))?;
    let (path, file) = fs_util::get_tab_file(state, tab_id, file_id)?;
    let child = path.join(file.name.as_ref());
    create_tab_imp(state, child).await
}

// ---------------------------------------------------------------------------------------------------------------------
/// タブ作成 (指定タブの親ディレクトリ)
#[tauri::command]
#[specta::specta]
pub async fn clone_tab_parent_dir(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
) -> Result<TabInfoUI, String> {
    LOG_RESULT!(format!("clone_tab_parent_dir({tab_id})"), {
        clone_tab_parent_dir_impl(&state, tab_id)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn clone_tab_parent_dir_impl(state: &AppState, tab_id: TabId) -> anyhow::Result<TabInfoUI> {
    let path = fs_util::get_tab_path(state, tab_id)?;
    let parent = path.parent().ok_or_else(|| anyhow!(""))?;
    create_tab_imp(state, parent).await
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
pub fn get_tabs(state: State<'_, Arc<AppState>>) -> Vec<TabInfoUI> {
    log::trace!("get_tabs()");
    get_tabs_impl(&state)
}
fn get_tabs_impl(state: &AppState) -> Vec<TabInfoUI> {
    let mut ret = Vec::new();
    for id in state.get_tab_ids() {
        let tab = state.get_tab(id).unwrap();
        ret.push(tab.read().unwrap().to_ui());
    }

    todo!()
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
fn get_dir_entries_impl(state: &AppState, tab_id: TabId) -> Result<Vec<DirEntryUI>, String> {
    let tab = state.get_tab(tab_id).map_err(|e| e.to_string())?;
    let mut tab = tab.write().unwrap();
    Ok(tab.create_dir_entries())
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
async fn get_file_infos_impl(
    state: &AppState,
    tab_id: TabId,
    file_ids: Vec<String>,
) -> anyhow::Result<Vec<FileInfoUI>> {
    let tab = state.get_tab(tab_id)?;
    let mut tab = tab.write().unwrap();
    let mut ret = Vec::new();
    for s in file_ids {
        let file_id: u64 = s.parse().map_err(|_| anyhow!("invalid file_id as u64"))?;
        tab.load_metadata(file_id)?;
        let file_info = tab.get_file_info(file_id)?;
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
fn sort_files_impl(
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

// =============================================================================================
//
// #####################   #####################      ###############      #####################
// #####################   #####################      ###############      #####################
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###                              ###
//          ###            ###                     ###                              ###
//          ###            ###############            ###############               ###
//          ###            ###############            ###############               ###
//          ###            ###                                       ###            ###
//          ###            ###                                       ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            #####################      ###############               ###
//          ###            #####################      ###############               ###
//
// =============================================================================================

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use crate::{types::FileId, UT_LOG};

    use super::*;

    fn get_test_dir() -> PathBuf {
        std::env::current_dir().unwrap().join("testdata")
    }

    #[tokio::test]
    async fn test_create_tab() {
        let state = AppState::new();
        assert_eq!(state.tabs.len(), 0);

        assert_eq!(1, create_tab_imp(&state, get_test_dir()).await.unwrap().id);
        assert_eq!(state.tabs.len(), 1);
        assert_eq!(state.get_tab_ids(), vec![1]);

        assert_eq!(2, create_tab_imp(&state, get_test_dir()).await.unwrap().id);
        assert_eq!(state.tabs.len(), 2);
        assert_eq!(state.get_tab_ids(), vec![1, 2]);

        // 指定されたディレクトリが存在しない場合は親に移動すること
        let (abs_path_dummy, expect) = {
            #[cfg(target_os = "windows")]
            {
                ("c:\\xxx\\yyy\\zzz", "c:\\")
            }
            #[cfg(target_os = "linux")]
            {
                ("/xxx/yyy/zzz", "/")
            }
        };
        assert_eq!(
            expect.to_string(),
            create_tab_imp(&state, abs_path_dummy).await.unwrap().path
        );

        assert_eq!(
            "not absolute. path:\"xyz\"".to_string(),
            create_tab_imp(&state, "xyz").await.unwrap_err().to_string()
        );
    }

    #[tokio::test]
    async fn test_remove_tab() {
        let state = AppState::new();
        create_tab_imp(&state, get_test_dir()).await.unwrap();
        create_tab_imp(&state, get_test_dir()).await.unwrap();

        assert_eq!(remove_tab_impl(&state, 99), Err("no tab: 99".to_string()));

        assert_eq!(remove_tab_impl(&state, 1), Ok(()));
        assert_eq!(remove_tab_impl(&state, 1), Err("no tab: 1".to_string()));
        assert_eq!(remove_tab_impl(&state, 2), Ok(()));

        assert_eq!(state.tabs.len(), 0);
        assert_eq!(state.next_tab_id.load(SeqCst), 3);
    }

    #[tokio::test]
    async fn test_get_dir_entries() {
        let state = AppState::new();

        let tab_id = create_tab_imp(&state, get_test_dir()).await.unwrap().id;
        let ret = get_dir_entries_impl(&state, tab_id).unwrap();

        assert_eq!(ret.len(), 4);

        assert_eq!(ret[0].name, Arc::from("d1"));
        assert_eq!(ret[1].name, Arc::from("d2"));
        assert_eq!(ret[2].name, Arc::from("d3"));
        assert_eq!(ret[3].name, Arc::from("fff.txt"));

        assert_eq!(ret[0].is_dir, true);
        assert_eq!(ret[1].is_dir, true);
        assert_eq!(ret[2].is_dir, true);
        assert_eq!(ret[3].is_dir, false);

        let test_dir = get_test_dir().join("d2");
        let tab_id = create_tab_imp(&state, test_dir).await.unwrap().id;
        let ret = get_dir_entries_impl(&state, tab_id).unwrap();

        assert_eq!(ret.len(), 2);
        assert_eq!(ret[0].name, Arc::from("f2-1.txt"));
        assert_eq!(ret[1].name, Arc::from("f2-2.txt"));
    }

    #[tokio::test]
    async fn test_get_file_infos() {
        let state = AppState::new();
        let call = async |tab_id: TabId, file_id: &str| {
            get_file_infos_impl(&state, tab_id, vec![file_id.to_string()])
                .await
                .map_err(|e| e.to_string())
                .map(|v| v.into_iter().next().unwrap())
        };
        // タブを作る前はエラー
        assert_eq!(call(0, "").await, Err("invalid tab_id: 0".to_string()));

        let tab_id = create_tab_imp(&state, get_test_dir().join("d3"))
            .await
            .unwrap()
            .id;

        // 不正なファイルIDを渡すとエラー
        assert_eq!(
            call(tab_id, "").await,
            Err("invalid file_id as u64".to_string())
        );
        assert_eq!(
            call(tab_id, " 1").await,
            Err("invalid file_id as u64".to_string())
        );
        assert_eq!(
            call(tab_id, "1 ").await,
            Err("invalid file_id as u64".to_string())
        );
        assert_eq!(
            call(tab_id, "１").await,
            Err("invalid file_id as u64".to_string())
        );

        // ディレクトリ読み込み
        let dir_entries = get_dir_entries_impl(&state, tab_id).unwrap();
        for ent in &dir_entries {
            UT_LOG!("{}", ent.name);
        }

        // 存在しないファイルIDを渡すとエラー
        assert_eq!(
            call(tab_id, "99999").await,
            Err("no file[99999] for tab[1]".to_string())
        );

        let call_n =
            async |tab_id: TabId, file_id: FileId| call(tab_id, &file_id.to_string()).await;

        // xxx (空ディレクトリ)
        let finfo = call_n(tab_id, dir_entries[0].file_id).await.unwrap();
        assert_eq!(finfo.metadata.as_ref().right().unwrap().size, None);
        // f3-1.txt
        let finfo = call_n(tab_id, dir_entries[1].file_id).await.unwrap();
        assert_eq!(finfo.metadata.as_ref().right().unwrap().size, Some(1));
        // f3-3.txt
        let finfo = call_n(tab_id, dir_entries[3].file_id).await.unwrap();
        assert_eq!(finfo.metadata.as_ref().right().unwrap().size, Some(3));
    }
}
