//! ファイル操作
use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

use anyhow::{anyhow, Context};
use tauri::{AppHandle, Emitter, State};
use walkdir::WalkDir;

use crate::{
    commands::fs_util::{cnv_file_ids_to_path, is_valid_filename, parse_file_id_str},
    state::{app_state::AppState, task::TaskContext},
    types::{
        FileOpResult, GetFilesPropertyNotifyEvent, RemoveFilesNotifyEvent, TabId, TaskId,
        EVENT_NAME_FILE_DELETE_PROGRESS_NOTIFY, EVENT_NAME_GET_FILES_PROPERTY_NOTIFY,
    },
    util::ErrorExt,
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
type RemoveFilesTaskContext = TaskContext<RemoveFilesNotifyEvent>;

#[tauri::command]
#[specta::specta]
/// 削除
pub async fn remove_files(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: Vec<String>,
    task_id: TaskId,
) -> Result<(), String> {
    let state: &Arc<AppState> = &state;
    let ctx = TaskContext::new(
        app,
        state.clone(),
        task_id,
        tab_id,
        RemoveFilesNotifyEvent::new(task_id),
    );
    LOG_RESULT!(
        format!(
            "remove_file(tab:{}, file:[len={}], task:{})",
            tab_id,
            file_ids.len(),
            task_id
        ),
        {
            remove_files_impl1(ctx, &file_ids)
                .await
                .map_err(|e| e.to_string())
        }
    )
}
async fn remove_files_impl1(
    ctx: RemoveFilesTaskContext,
    file_ids: &[String],
) -> anyhow::Result<()> {
    let paths = cnv_file_ids_to_path(&ctx.state, ctx.tab_id, file_ids)?;

    tauri::async_runtime::spawn(async move {
        let mut ctx = ctx;
        let ret = remove_files_impl2(&mut ctx, paths).await;

        match ret {
            Ok(_) => {
                ctx.event.head.error_msg = None;
            }
            Err(e) => {
                ctx.event.head.error_msg = Some(e.to_full_string());
                log::error!(
                    "remove_files: error task_id={}, {}",
                    ctx.task_id,
                    e.to_full_string()
                );
            }
        }
        ctx.event.head.finished = true;
        ctx.event.head.canceled = ctx.is_canceled();
        ctx.event.head.event_time_ms = 0; // 最後なので必ず通知させる
        let _ = emit_event_remove_files(&mut ctx).err().map(|e| {
            log::error!("remove_files: notify error task_id={}, {}", ctx.task_id, e);
        });
    });
    Ok(())
}
async fn remove_files_impl2(
    ctx: &mut RemoveFilesTaskContext,
    paths: Vec<PathBuf>,
) -> anyhow::Result<()> {
    for path in paths {
        if ctx.is_canceled() {
            break;
        }
        remove_files_impl3(ctx, path).await?;
    }
    Ok(())
}
async fn remove_files_impl3(ctx: &mut RemoveFilesTaskContext, path: PathBuf) -> anyhow::Result<()> {
    for walk in WalkDir::new(path).contents_first(true) {
        if ctx.is_canceled() {
            return Ok(());
        }

        let f = walk?;
        let meta = f.metadata()?;
        if meta.is_symlink() {
            return Err(anyhow!("リンクは削除できません: {:?}", f.path()));
        } else if meta.is_dir() {
            rm_dir(f.path()).context(format!("{}", f.path().to_string_lossy()))?;
            ctx.event.progress.dires += 1;
        } else {
            rm_file(f.path()).context(format!("{}", f.path().to_string_lossy()))?;
            ctx.event.progress.files += 1;
            ctx.event.progress.size += meta.len();
        }

        emit_event_remove_files(ctx)?;

        let pref = ctx.state.preferences.read().unwrap();
        let sleep = pref.debug_file_op_sleep_ms;
        if 0 < sleep {
            std::thread::sleep(Duration::from_millis(sleep as u64));
        }
    }

    Ok(())
}
fn rm_dir(path: impl AsRef<Path>) -> anyhow::Result<()> {
    if let Err(e) = fs::remove_dir(&path) {
        match get_alt_path(path, &e) {
            None => return Err(e)?,
            Some(alt_path) => return Ok(fs::remove_dir(alt_path)?),
        }
    }
    Ok(())
}
fn rm_file(path: impl AsRef<Path>) -> anyhow::Result<()> {
    if let Err(e) = fs::remove_file(&path) {
        match get_alt_path(path, &e) {
            None => return Err(e)?,
            Some(alt_path) => return Ok(fs::remove_file(alt_path)?),
        }
    }
    Ok(())
}
fn get_alt_path(path: impl AsRef<Path>, err: &std::io::Error) -> Option<PathBuf> {
    // Windows で "text.txt " のようなファイルを削除するための特別なパスを作る
    #[cfg(target_os = "windows")]
    {
        if err.kind() == std::io::ErrorKind::NotFound {
            use std::ffi::OsString;
            let mut path2 = OsString::from(r"\\?\");
            path2.push(path.as_ref().as_os_str());
            return Some(PathBuf::from(path2));
        }
    }
    None
}
fn emit_event_remove_files(ctx: &mut RemoveFilesTaskContext) -> anyhow::Result<()> {
    if !ctx.can_emit_event()? {
        return Ok(());
    }
    ctx.app
        .emit(EVENT_NAME_FILE_DELETE_PROGRESS_NOTIFY, ctx.event.clone())?;
    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------
type GetFilesPropertyTaskContext = TaskContext<GetFilesPropertyNotifyEvent>;

#[tauri::command]
#[specta::specta]
/// ファイル／ディレクトリの情報取得
/// 途中経過と最終結果は [`GetFilesPropertyNotifyEvent`] でUIに通知される
pub async fn get_files_property(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: Vec<String>,
    task_id: TaskId,
) -> Result<(), String> {
    let state: &Arc<AppState> = &state;
    let ctx = TaskContext::new(
        app,
        state.clone(),
        task_id,
        tab_id,
        GetFilesPropertyNotifyEvent::new(task_id),
    );
    LOG_RESULT!(
        format!(
            "get_files_property(tab:{},file:[len={}], task:{})",
            tab_id,
            file_ids.len(),
            task_id,
        ),
        {
            get_files_property_impl1(ctx, &file_ids)
                .await
                .map_err(|e| e.to_string())
        }
    )
}
async fn get_files_property_impl1(
    ctx: GetFilesPropertyTaskContext,
    file_ids: &[String],
) -> anyhow::Result<()> {
    let paths = cnv_file_ids_to_path(&ctx.state, ctx.tab_id, file_ids)?;

    tauri::async_runtime::spawn(async move {
        let mut ctx = ctx;
        let ret = get_files_property_impl2(&mut ctx, paths).await;

        match ret {
            Ok(_) => {
                ctx.event.head.error_msg = None;
            }
            Err(e) => {
                ctx.event.head.error_msg = Some(e.to_string());
                log::error!("get_files_property: error task_id={}, {}", ctx.task_id, e);
            }
        }
        ctx.event.head.finished = true;
        ctx.event.head.canceled = ctx.is_canceled();
        ctx.event.head.event_time_ms = 0; // 最後なので必ず通知させる
        let _ = emit_event_get_files_property(&mut ctx).err().map(|e| {
            log::error!(
                "get_files_property: notify error task_id={}, {}",
                ctx.task_id,
                e
            );
        });
    });
    Ok(())
}
async fn get_files_property_impl2(
    ctx: &mut GetFilesPropertyTaskContext,
    paths: Vec<PathBuf>,
) -> anyhow::Result<()> {
    for path in paths {
        if ctx.is_canceled() {
            break;
        }
        get_files_property_impl3(ctx, path).await?;
    }
    Ok(())
}
async fn get_files_property_impl3(
    ctx: &mut GetFilesPropertyTaskContext,
    path: PathBuf,
) -> anyhow::Result<()> {
    for walk in WalkDir::new(path) {
        if ctx.is_canceled() {
            return Ok(());
        }

        let f = walk?;
        let meta = f.metadata()?;
        if meta.is_symlink() {
            ctx.event.progress.symlinks += 1;
        } else if meta.is_dir() {
            ctx.event.progress.dires += 1;
        } else {
            ctx.event.progress.files += 1;
            ctx.event.progress.size += meta.len();
        }

        emit_event_get_files_property(ctx)?;
    }

    Ok(())
}
fn emit_event_get_files_property(ctx: &mut GetFilesPropertyTaskContext) -> anyhow::Result<()> {
    if !ctx.can_emit_event()? {
        return Ok(());
    }
    ctx.app
        .emit(EVENT_NAME_GET_FILES_PROPERTY_NOTIFY, ctx.event.clone())?;
    Ok(())
}
