use std::{
    fs,
    os::windows::fs::MetadataExt,
    path::PathBuf,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};

use tauri::{AppHandle, Emitter, State};
use walkdir::WalkDir;

use crate::{
    commands::fs_util::{is_valid_filename, parse_file_id_str},
    state::app_state::AppState,
    types::{
        FileOpResult, GetFilesPropertyNotifyEvent, TabId, TaskId,
        EVENT_NAME_GET_FILES_PROPERTY_NOTIFY,
    },
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
    prepared: GetFilesPropertyNotifyEvent,
) -> Result<(), String> {
    LOG_RESULT!(format!("rename_file({}, [{}])", tab_id, file_ids.len()), {
        remove_files_impl(state, tab_id, &file_ids, &prepared)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn remove_files_impl(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: &Vec<String>,
    prepared: &GetFilesPropertyNotifyEvent,
) -> anyhow::Result<()> {
    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();

    todo!();
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ファイル／ディレクトリの情報取得
pub async fn get_files_property(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: Vec<String>,
    task_id: TaskId,
) -> Result<(), String> {
    LOG_RESULT!(
        format!(
            "get_files_property({}, {}, [len={}])",
            task_id,
            tab_id,
            file_ids.len()
        ),
        {
            get_files_property_impl1(app, &state, tab_id, &file_ids, task_id)
                .await
                .map_err(|e| e.to_string())
        }
    )
}
async fn get_files_property_impl1(
    app: AppHandle,
    state: &Arc<AppState>,
    tab_id: TabId,
    file_ids: &Vec<String>,
    task_id: TaskId,
) -> anyhow::Result<()> {
    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();
    let file_ids: Result<Vec<_>, _> = file_ids.iter().map(|s| parse_file_id_str(s)).collect();
    let mut paths = Vec::<PathBuf>::new();
    for file_id in file_ids? {
        let f = tab.get_file_info(file_id)?;
        paths.push(tab.get_path().join(&*f.name));
    }
    let task = state.add_task(task_id);

    let state2 = state.clone();
    tauri::async_runtime::spawn(async move {
        let _task = task; // タスクが終わるまで state から消えないように保持する
        let mut result_event = GetFilesPropertyNotifyEvent::default();
        result_event.task_id = task_id;
        let ret =
            get_files_property_impl2(&app, &state2, tab_id, task_id, paths, &mut result_event)
                .await;

        match ret {
            Ok(_) => {
                result_event.error_msg = None;
            }
            Err(e) => {
                result_event.error_msg = Some(e.to_string());
                log::error!(
                    "get_files_property: error task_id={}, {}",
                    task_id,
                    e.to_string()
                );
            }
        }
        result_event.finished = true;
        result_event.canceled = is_canceled(&state2, tab_id, task_id);
        result_event.event_time_ms = 0; // 最後なので必ず通知させる
        emit_event(&app, &mut result_event).err().map(|e| {
            log::error!(
                "get_files_property: notify error task_id={}, {}",
                task_id,
                e.to_string()
            );
        });
    });
    Ok(())
}
async fn get_files_property_impl2(
    app: &AppHandle,
    state: &Arc<AppState>,
    tab_id: TabId,
    task_id: TaskId,
    paths: Vec<PathBuf>,
    result_event: &mut GetFilesPropertyNotifyEvent,
) -> anyhow::Result<()> {
    for path in paths {
        if is_canceled(&state, tab_id, task_id) {
            break;
        }
        get_files_property_impl3(app, state, tab_id, task_id, path, result_event).await?;
    }
    Ok(())
}
async fn get_files_property_impl3(
    app: &AppHandle,
    state: &Arc<AppState>,
    tab_id: TabId,
    task_id: TaskId,
    path: PathBuf,
    result_event: &mut GetFilesPropertyNotifyEvent,
) -> anyhow::Result<()> {
    for walk in WalkDir::new(path) {
        if is_canceled(&state, tab_id, task_id) {
            return Ok(());
        }

        let f = walk?;
        let meta = f.metadata()?;
        if meta.is_symlink() {
            result_event.symlinks += 1;
        } else if meta.is_dir() {
            result_event.dires += 1;
        } else {
            result_event.files += 1;
            result_event.size += meta.file_size();
        }

        emit_event(app, result_event)?;
    }

    Ok(())
}
fn is_canceled(state: &Arc<AppState>, tab_id: TabId, task_id: TaskId) -> bool {
    !state.has_tab(tab_id) || state.is_task_canceled(task_id)
}
fn emit_event(
    app: &AppHandle,
    result_event: &mut GetFilesPropertyNotifyEvent,
) -> anyhow::Result<()> {
    let t = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis();
    if t - result_event.event_time_ms < 100 {
        return Ok(());
    }
    result_event.event_time_ms = t;
    result_event.event_count += 1;
    app.emit(EVENT_NAME_GET_FILES_PROPERTY_NOTIFY, result_event.clone())?;
    Ok(())
}
