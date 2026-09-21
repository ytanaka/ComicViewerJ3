use std::{path::PathBuf, sync::Arc};

use image::{DynamicImage, RgbaImage};
use tauri::{AppHandle, State};

use anyhow::{anyhow, Context};

use crate::commands::images_util::{get_resized_img_fullpath, get_thubmnail_fullpath};
use crate::file_operations::file_utils::{self, touch_file};
use crate::file_operations::image_utils::{
    calc_resize, get_img_size, is_picture_ext, resize_lanczos3, unsharp_mask,
};
use crate::types::{Dimension, Either, GetResizedImgResult, GetThumbnailResult, ImageResizeConfig};
use crate::util::ErrorExt;
use crate::LOG_RESULT;
use crate::{
    commands::fs_util::get_tab_file, file_operations::file_utils::read_metadata,
    state::app_state::AppState, types::TabId,
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// 画像のサイズを取得
pub async fn get_image_size(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_id: String,
) -> Result<Option<Dimension>, String> {
    let comment = format!("get_image_size({},{})", tab_id, file_id);
    LOG_RESULT!(comment, {
        get_image_size_impl(&state, tab_id, file_id).map_err(|e| e.to_full_string())
    })
}
pub fn get_image_size_impl(
    state: &AppState,
    tab_id: TabId,
    file_id: String,
) -> anyhow::Result<Option<Dimension>> {
    let file_id: u64 = file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))?;

    // 元画像ファイル情報取得
    let (dir, file) = get_tab_file(state, tab_id, file_id)?;

    // 変換元画像ファイル
    let src_path = dir.join(&*file.name);
    if !src_path.is_file() || !is_picture_ext(&src_path) {
        return Ok(None);
    }

    // 変換元画像のサイズ
    match get_img_size(&src_path) {
        Err(_) => Ok(None),
        Ok(size) => Ok(Some(size)),
    }
}

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
) -> Result<GetThumbnailResult, String> {
    let comment = format!("get_thumbnail({}, {}, {})", tab_id, file_id, size);
    let mut running = 0;
    let result = match state.thumbnail_command_limitter.try_acquire() {
        None => Ok(GetThumbnailResult::Busy),
        Some(permit) => {
            running = permit.running;
            let state2 = state.inner().clone();
            let result = tauri::async_runtime::spawn_blocking(move || {
                get_thumbnail_impl(&app, &state2, tab_id, &file_id, &Dimension::new(size, size))
            });
            result.await.unwrap()
        }
    };
    LOG_RESULT!(format!("{comment}, running[{running}]"), {
        result.map_err(|e| e.to_full_string())
    })
}
pub fn get_thumbnail_impl(
    app: &AppHandle,
    state: &AppState,
    tab_id: TabId,
    file_id: &str,
    size: &Dimension,
) -> anyhow::Result<GetThumbnailResult> {
    let file_id: u64 = file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))?;

    // 元画像ファイル情報取得
    let (dir, file) = get_tab_file(state, tab_id, file_id)?;
    let meta = match read_metadata(&dir, &file.name) {
        Either::Left(e) => return Err(anyhow!(e)),
        Either::Right(m) => m,
    };

    // 生成するサムネイル画像のフルパス取得
    let (dst_path, dst_tmp_path) = get_thubmnail_fullpath(app, &dir, &file.name, &meta, size)?;
    if dst_path.exists() {
        // すでに存在するなら、更新日時を最新にしておく
        if let Err(e) = touch_file(&dst_path) {
            log::warn!("get_thumbnail_impl: {:?}, error = {}", dst_path, e);
        }
        return Ok(GetThumbnailResult::Ok {
            filename: dst_path.to_string_lossy().to_string(),
        });
    }

    // 変換元画像ファイルを探す
    let src_path = match get_thumbnail_target_file(state, &dir.join(&*file.name), 3) {
        Err(msg) => return Ok(GetThumbnailResult::Fail { error_msg: msg }),
        Ok(None) => return Ok(GetThumbnailResult::NoImage),
        Ok(Some(path)) => path,
    };

    // 画像読み込み
    let img = match image::open(&src_path) {
        Ok(i) => i,
        Err(e) => {
            return Ok(GetThumbnailResult::Fail {
                error_msg: e.to_string(),
            })
        }
    };
    // リサイズ
    let img = resize_to_thumbnail(&img, size)?;
    // セーブ
    img.save(&dst_tmp_path)
        .context(format!("fail save imgcache: {:?}", dst_tmp_path))?;
    std::fs::rename(&dst_tmp_path, &dst_path)?;

    Ok(GetThumbnailResult::Ok {
        filename: dst_path.to_string_lossy().to_string(),
    })
}
/// サムネイル対象のファイルを探す。
/// 必要なら、サブディレクトリを探す
///
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
fn resize_to_thumbnail(img: &DynamicImage, target_size: &Dimension) -> anyhow::Result<RgbaImage> {
    let img = &img.to_rgba8();
    let size = calc_resize(&Dimension::from(img), target_size, 2);
    let resized = resize_lanczos3(img, &size)?;
    let resize_config = ImageResizeConfig::default();
    let unsharped = unsharp_mask(resized, &resize_config);
    Ok(unsharped)
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// リサイズした画像ファイルを取得する
pub async fn get_resized_img(
    app: AppHandle,
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_id: String,
    target_size: Dimension,
) -> Result<GetResizedImgResult, String> {
    let comment = format!("get_resized_img({}, {}, {})", tab_id, file_id, target_size);
    let mut running = 0;
    let result = match state.resize_img_command_limitter.try_acquire() {
        None => Ok(GetResizedImgResult::Busy),
        Some(permit) => {
            running = permit.running;
            let state2 = state.inner().clone();
            let result = tauri::async_runtime::spawn_blocking(move || {
                get_resized_img_impl(&app, &state2, tab_id, &file_id, &target_size)
            });
            result.await.unwrap()
        }
    };
    LOG_RESULT!(format!("{comment}, running[{running}]"), {
        result.map_err(|e| e.to_full_string())
    })
}
pub fn get_resized_img_impl(
    app: &AppHandle,
    state: &AppState,
    tab_id: TabId,
    file_id: &str,
    target_size: &Dimension,
) -> anyhow::Result<GetResizedImgResult> {
    let file_id: u64 = file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))?;

    // 元画像ファイルメタデータ取得
    let (dir, file) = get_tab_file(state, tab_id, file_id)?;
    let meta = match file.metadata {
        Some(m) => m.as_ref().clone(),
        None => read_metadata(&dir, &file.name),
    };
    let meta = match meta {
        Either::Left(e) => return Err(anyhow!(e)),
        Either::Right(m) => m,
    };

    // 変換元画像ファイルパス
    let src_path = dir.join(&*file.name);
    if !src_path.is_file() || !is_picture_ext(&src_path) {
        return Ok(GetResizedImgResult::Fail {
            error_msg: "not a picture file".to_string(),
        });
    }

    // 生成する画像のフルパス取得
    let resize_config = &state.preferences.read().unwrap().image_resize_config;
    let (dst_path, dst_tmp_path) =
        get_resized_img_fullpath(app, &dir, &file.name, &meta, target_size, resize_config)?;
    if dst_path.exists() {
        // すでに存在するなら、更新日時を最新にしておく
        if let Err(e) = touch_file(&dst_path) {
            log::warn!("get_resized_img_impl: {:?}, error = {}", dst_path, e);
        }
        return Ok(GetResizedImgResult::Ok {
            filename: dst_path.to_string_lossy().to_string(),
        });
    }

    // 画像読み込み
    let img = match image::open(&src_path) {
        Ok(i) => i,
        Err(e) => {
            return Ok(GetResizedImgResult::Fail {
                error_msg: e.to_string(),
            })
        }
    };
    // リサイズ
    let img = resize_image(&img, target_size, resize_config)?;

    // セーブ
    img.save(&dst_tmp_path)
        .context(format!("fail save imgcache: {:?}", dst_tmp_path))?;
    std::fs::rename(&dst_tmp_path, &dst_path)?;

    Ok(GetResizedImgResult::Ok {
        filename: dst_path.to_string_lossy().to_string(),
    })
}
fn resize_image(
    img: &DynamicImage,
    target_size: &Dimension,
    config: &ImageResizeConfig,
) -> anyhow::Result<RgbaImage> {
    let img = &img.to_rgba8();
    let size = calc_resize(&Dimension::from(img), target_size, 2);
    let resized = resize_lanczos3(img, &size)?;
    let unsharped = unsharp_mask(resized, config);
    Ok(unsharped)
}
