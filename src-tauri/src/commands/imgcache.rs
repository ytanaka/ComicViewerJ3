use std::{path::PathBuf, sync::Arc};

use image::{DynamicImage, RgbaImage};
use tauri::{AppHandle, State};

use anyhow::{anyhow, Context};

use crate::commands::imgcache_util::{get_imgcache_fullpath, ImageCacheType};
use crate::file_operations::file_utils::{self, touch_file};
use crate::file_operations::image_utils::{
    calc_size, is_picture_ext, resize_lanczos3, unsharp_mask,
};
use crate::types::{Either, GetImgCachelResult, ImageSize};
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
    size: u32,
) -> Result<GetImgCachelResult, String> {
    let comment = format!("get_thumbnail({}, {}, {})", tab_id, file_id, size);
    let mut running = 0;
    let result = match state.thumbnail_command_limitter.try_acquire() {
        None => Ok(GetImgCachelResult::Busy),
        Some(permit) => {
            running = permit.running;
            let state2 = state.inner().clone();
            let result = tauri::async_runtime::spawn_blocking(move || {
                get_imgcache_impl(
                    &app,
                    &state2,
                    tab_id,
                    &file_id,
                    &ImageCacheType::Thumbnail,
                    &ImageSize::new(size, size),
                )
            });
            result.await.unwrap()
        }
    };
    LOG_RESULT!(format!("{comment}, running[{running}]"), {
        result.map_err(|e| e.to_string())
    })
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 画像ファイルをリサイズする
pub async fn get_resized_img(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_id: String,
    size: ImageSize,
) -> Result<GetImgCachelResult, String> {
    let comment = format!("get_resized_img({}, {}, {})", tab_id, file_id, size);
    let mut running = 0;
    let result = match state.resize_img_command_limitter.try_acquire() {
        None => Ok(GetImgCachelResult::Busy),
        Some(permit) => {
            running = permit.running;
            let state2 = state.inner().clone();
            let result = tauri::async_runtime::spawn_blocking(move || {
                get_imgcache_impl(
                    &app,
                    &state2,
                    tab_id,
                    &file_id,
                    &ImageCacheType::ResizedImage,
                    &size,
                )
            });
            result.await.unwrap()
        }
    };
    LOG_RESULT!(format!("{comment}, running[{running}]"), {
        result.map_err(|e| e.to_string())
    })
}

pub fn get_imgcache_impl(
    app: &AppHandle,
    state: &AppState,
    tab_id: TabId,
    file_id: &str,
    subdir: &ImageCacheType,
    size: &ImageSize,
) -> anyhow::Result<GetImgCachelResult> {
    let file_id: u64 = file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))?;

    // 元画像ファイル/ディレクトリ情報取得
    let (dir, file) = get_tab_file(state, tab_id, file_id)?;
    let meta = match read_metadata(&dir, &file.name) {
        Either::Left(e) => return Err(anyhow!(e)),
        Either::Right(m) => m,
    };

    // 生成する画像のフルパス取得
    let (img_path, tmp_img_path) =
        get_imgcache_fullpath(app, subdir, &dir, &file.name, &meta, size)?;
    if img_path.exists() {
        // すでに存在するなら、更新日時を最新にしておく
        if let Err(e) = touch_file(&img_path) {
            log::warn!("get_imgcache_impl: {:?}, error = {}", img_path, e);
        }
        return Ok(GetImgCachelResult::Ok {
            filename: img_path.to_string_lossy().to_string(),
        });
    }

    // サムネイル化対象ファイルを探す
    let search_depth = match subdir {
        ImageCacheType::ResizedImage => 0,
        ImageCacheType::Thumbnail => 3,
    };
    let src_file = match get_thumbnail_target_file(state, &dir.join(&*file.name), search_depth) {
        Err(msg) => return Ok(GetImgCachelResult::Fail { error_msg: msg }),
        Ok(None) => return Ok(GetImgCachelResult::NoImage),
        Ok(Some(path)) => path,
    };

    // サムネイルファイル作成
    let img = match image::open(&src_file) {
        Ok(i) => i,
        Err(e) => {
            return Ok(GetImgCachelResult::Fail {
                error_msg: e.to_string(),
            })
        }
    };
    let img = resize_image(img, size)?;
    img.save(&tmp_img_path)
        .context(format!("fail save imgcache: {:?}", tmp_img_path))?;
    std::fs::rename(&tmp_img_path, &img_path)?;

    Ok(GetImgCachelResult::Ok {
        filename: img_path.to_string_lossy().to_string(),
    })
}

fn resize_image(img: DynamicImage, screen_size: &ImageSize) -> anyhow::Result<RgbaImage> {
    let img = &img.to_rgba8();
    let size = calc_size(&img, screen_size);
    let resized = resize_lanczos3(&img, size)?;
    Ok(unsharp_mask(&resized, 0.7, 0.8))
}

/// サムネイル対象のファイルを探す。
/// 必要なら、サブディレクトリを探す
/// return OK(Some(filename)): 見つかった
/// return OK(None): 見つからなかった
/// return Err(msg): ファイル or ディレクトリが読めない
fn get_thumbnail_target_file(
    state: &AppState,
    path: &PathBuf,
    max_depth: usize,
) -> Result<Option<PathBuf>, String> {
    // ファイルの場合
    if path.is_file() {
        if is_picture_ext(path) {
            return Ok(Some(path.to_path_buf()));
        } else {
            return Ok(None);
        }
    }

    if max_depth == 0 {
        return Ok(None);
    };

    // ディレクトリの場合
    let mut list = match file_utils::read_dir(path) {
        Err(e) => return Err(e.to_string()),
        Ok(x) => x,
    };
    file_utils::sort_by_name(state, &mut list);
    if list.is_empty() {
        return Ok(None);
    }

    let path = path.join(list.first().unwrap().name.as_ref());
    get_thumbnail_target_file(state, &path, max_depth - 1)
}
