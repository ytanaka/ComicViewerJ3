use std::path::Path;

use std::{path::PathBuf, sync::Arc};

use tauri::{AppHandle, State};

use anyhow::{anyhow, Context};

use crate::commands::thumbnail_util::{get_thumbnail_fullpath, is_picture_ext};
use crate::file_operations::file_utils::{self, touch_file};
use crate::types::{Either, FileInfoOS, GetThumbnailResult, ImageSize};
use crate::LOG_RESULT;
use crate::{
    commands::fs_util::get_tab_file, file_operations::file_utils::read_metadata,
    state::app_state::AppState, types::TabId,
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 画像ファイルのサムネイルを取得
pub async fn get_thumbnail(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_id: String,
    size: ImageSize,
) -> Result<GetThumbnailResult, String> {
    let comment = format!("get_thumbnail({}, {}, {})", tab_id, file_id, size);
    let mut running = 0;
    let result = match state.thumbnail_command_limitter.try_acquire() {
        None => Ok(GetThumbnailResult::Busy),
        Some(permit) => {
            running = permit.running;
            let state2 = state.inner().clone();
            let result = tauri::async_runtime::spawn_blocking(move || {
                get_thumbnail_impl(&app, &state2, tab_id, &file_id, size)
            });
            result.await.unwrap()
        }
    };
    LOG_RESULT!(format!("{comment}, running[{running}]"), {
        result.map_err(|e| e.to_string())
    })
}
pub fn get_thumbnail_impl(
    app: &AppHandle,
    state: &AppState,
    tab_id: TabId,
    file_id: &str,
    size: ImageSize,
) -> anyhow::Result<GetThumbnailResult> {
    let file_id: u64 = file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))?;

    // 元画像ファイル/ディレクトリ情報取得
    let (dir, file) = get_tab_file(state, tab_id, file_id)?;
    let meta = match read_metadata(&dir, &file.name) {
        Either::Left(e) => return Err(anyhow!(e)),
        Either::Right(m) => m,
    };

    // サムネイル画像のフルパス取得
    let (thumb_path, tmp_thumb_path) = get_thumbnail_fullpath(app, &dir, &file.name, &meta, size)?;
    if thumb_path.exists() {
        // すでに存在するなら、更新日時を最新にしておく
        if let Err(e) = touch_file(&thumb_path) {
            log::warn!("get_thumbnail_impl: {:?}, error = {}", thumb_path, e);
        }
        return Ok(GetThumbnailResult::Ok {
            filename: thumb_path.to_string_lossy().to_string(),
        });
    }

    // サムネイルファイル作成
    let src_file = match get_thumbnail_target_file(state, dir, &file)? {
        None => return Ok(GetThumbnailResult::NoImage),
        Some(path) => path,
    };
    let img = image::open(&src_file).context(format!("error: image file open {:?}", src_file))?;
    let thumbnail = img.thumbnail(size, size);
    thumbnail
        .save(&tmp_thumb_path)
        .context(format!("fail save thumbnail: {:?}", tmp_thumb_path))?;
    std::fs::rename(&tmp_thumb_path, &thumb_path)?;

    Ok(GetThumbnailResult::Ok {
        filename: thumb_path.to_string_lossy().to_string(),
    })
}

/// サムネイル対象のファイルを探す。
/// 必要なら、サブディレクトリを探す
fn get_thumbnail_target_file(
    state: &AppState,
    dir: impl AsRef<Path>,
    file: &FileInfoOS,
) -> anyhow::Result<Option<PathBuf>> {
    let path = dir.as_ref().join(&*file.name);
    get_thumbnail_target_file2(state, &path, 1)
}

fn get_thumbnail_target_file2(
    state: &AppState,
    path: &PathBuf,
    depth: usize,
) -> anyhow::Result<Option<PathBuf>> {
    if 3 < depth {
        return Ok(None);
    };

    // ファイルの場合
    if path.is_file() {
        if is_picture_ext(path) {
            return Ok(Some(path.to_path_buf()));
        } else {
            return Ok(None);
        }
    }

    // ディレクトリの場合
    let mut list = file_utils::read_dir(&path)?;
    file_utils::sort_files(state, &mut list);
    if list.is_empty() {
        return Ok(None);
    }

    let path = path.join(list.get(0).unwrap().name.as_ref());
    get_thumbnail_target_file2(state, &path, depth + 1)
}
