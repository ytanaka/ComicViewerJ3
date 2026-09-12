use std::ffi::OsStr;
use std::fs::{self};
use std::path::Path;

use std::{path::PathBuf, sync::Arc};

use sha2::Digest;
use sha2::Sha256;
use tauri::Manager;
use tauri::{AppHandle, State};

use anyhow::{anyhow, Context};

use crate::file_operations::file_utils::touch_file;
use crate::types::{FileMetadata, ImageSize};
use crate::{
    commands::fs_util::get_tab_file, file_operations::file_utils::read_metadata,
    state::app_state::AppState, types::TabId,
};

// ---------------------------------------------------------------------------------------------------------------------

/// サムネイル保存用ディレクトリ取得
fn get_thumbnail_dir(app: &tauri::AppHandle) -> anyhow::Result<PathBuf> {
    let resolver = app.path();
    let p = resolver
        .app_cache_dir()
        .context("fail get thumbnail cache dir: error")?;
    let p = p.join("thumbnails");

    if !p.is_dir() {
        log::info!("mkdir thumbnail dir: {}", p.to_string_lossy());
        fs::create_dir_all(&p).context("fail create thumbnail cache dir")?;
    }
    Ok(p)
}

// return (サムネイルファイル名、セーブ時の一時ファイル名)
fn get_thumbnail_fullpath(
    app: &AppHandle,
    dir: impl AsRef<Path>,
    name: &OsStr,
    metadata: &FileMetadata,
    size: ImageSize,
) -> anyhow::Result<(PathBuf, PathBuf)> {
    // "16進文字列.jpg" を取得
    let mut hasher = Sha256::new();
    hasher.update(dir.as_ref().to_string_lossy().as_bytes());
    hasher.update(vec![0]);
    hasher.update(name.to_string_lossy().as_bytes());
    hasher.update(vec![0]);
    hasher.update(metadata.size.unwrap_or_default().to_ne_bytes());
    hasher.update(vec![0]);
    hasher.update(metadata.modified.unwrap_or_default().to_ne_bytes());
    let result = hasher.finalize();
    let name = format!("{}.jpg", hex::encode(result));

    // "/略/app_cache_dir()/thumbnails/{size}/FF"
    let path = get_thumbnail_dir(app)?
        .join(format!("{size}"))
        .join(hex::encode(&name[0..2]));

    let tmp = format!("_tmp_{}.jpg", uuid::Uuid::new_v4());
    Ok((path.join(&name), path.join(tmp)))
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
    size: ImageSize,
) -> Result<String, String> {
    let state2 = state.inner().clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        get_thumbnail_impl(&app, &state2, tab_id, file_id, size)
    });
    result.await.unwrap().map_err(|e| e.to_string())
}
pub fn get_thumbnail_impl(
    app: &AppHandle,
    state: &AppState,
    tab_id: TabId,
    file_id: String,
    size: ImageSize,
) -> anyhow::Result<String> {
    let file_id: u64 = file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))?;

    // 元画像ファイル情報取得
    let (dir, file) = get_tab_file(state, tab_id, file_id)?;
    let meta = match read_metadata(&dir, &file.name).into_right() {
        None => return Ok("".to_string()),
        Some(m) => m,
    };

    // サムネイル画像のフルパス取得
    let (thumb_path, tmp_thumb_path) = get_thumbnail_fullpath(app, &dir, &file.name, &meta, size)?;
    if thumb_path.exists() {
        // すでに存在するなら、更新日時を最新にしておく
        let _ = touch_file(&thumb_path);
        return Ok(thumb_path.to_string_lossy().to_string());
    }

    // サムネイルファイル作成
    let src_file = dir.join(&*file.name);
    let img = image::open(&src_file).context(format!("error: image file open {:?}", src_file))?;
    let thumbnail = img.thumbnail(size, size);
    thumbnail
        .save(&tmp_thumb_path)
        .context(format!("fail save thumbnail: {:?}", tmp_thumb_path))?;
    std::fs::rename(&tmp_thumb_path, &thumb_path)?;

    Ok(thumb_path.to_string_lossy().to_string())
}
