use std::ffi::OsStr;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use tauri::AppHandle;
use tauri::Manager;

use anyhow::Context;
use sha2::Digest;
use sha2::Sha256;

use crate::types::ImageResizeConfig;
use crate::types::{Dimension, FileMetadata};

const THUMBNAIL_EXT: &str = "png";
const RESIZED_IMG_EXT: &str = "png";

// ---------------------------------------------------------------------------------------------------------------------

/// 画像キャッシュ保存用ディレクトリ取得
pub fn get_thumbnail_dir(app: &tauri::AppHandle) -> anyhow::Result<PathBuf> {
    get_imgcache_dir(app, "thumbnail")
}
pub fn get_resized_img_dir(app: &tauri::AppHandle) -> anyhow::Result<PathBuf> {
    get_imgcache_dir(app, "resized_img")
}
fn get_imgcache_dir(app: &tauri::AppHandle, subdir: &str) -> anyhow::Result<PathBuf> {
    let resolver = app.path();
    let p = resolver
        .app_cache_dir()
        .context(format!("fail get {} cache dir: error", subdir))?;
    let p = p.join(subdir.to_string());

    if !p.is_dir() {
        log::info!("mkdir {} dir: {}", subdir, p.to_string_lossy());
        fs::create_dir_all(&p).context(format!("fail create {} cache dir", subdir))?;
    }
    Ok(p)
}

// return (サムネイルファイル名、セーブ時の一時ファイル名)
pub fn get_thubmnail_fullpath(
    app: &AppHandle,
    dir: impl AsRef<Path>,
    name: &OsStr,
    metadata: &FileMetadata,
    size: &Dimension,
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
    let name = format!("{}.{}", hex::encode(result), THUMBNAIL_EXT);

    // "/略/app_cache_dir()/thumbnail/{size}/FF"
    let path = get_thumbnail_dir(app)?
        .join(format!("{}", size.max()))
        .join(&name[0..2]);

    if !path.exists() {
        fs::create_dir_all(&path)
            .context(format!("fail create thumbnail cache dir: {:?}", path))?;
    }

    let tmp = format!("_tmp_{}.{}", uuid::Uuid::new_v4(), THUMBNAIL_EXT);
    Ok((path.join(&name), path.join(tmp)))
}

// return (画像キャッシュファイル名、セーブ時の一時ファイル名)
pub fn get_resized_img_fullpath(
    app: &AppHandle,
    dir: impl AsRef<Path>,
    name: &OsStr,
    metadata: &FileMetadata,
    config: &ImageResizeConfig,
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
    hasher.update(vec![0]);
    hasher.update(config.unsharp_sigma.to_ne_bytes());
    hasher.update(vec![0]);
    hasher.update(config.unsharp_amount.to_ne_bytes());
    let result = hasher.finalize();
    let name = format!("{}.{}", hex::encode(result), RESIZED_IMG_EXT);

    // "/略/app_cache_dir()/resized_img"
    let path = get_resized_img_dir(app)?;

    if !path.exists() {
        fs::create_dir_all(&path)
            .context(format!("fail create resized image cache dir: {:?}", path))?;
    }

    let tmp = format!("_tmp_{}.{}", uuid::Uuid::new_v4(), RESIZED_IMG_EXT);
    Ok((path.join(&name), path.join(tmp)))
}
