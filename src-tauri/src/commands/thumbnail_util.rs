use std::collections::HashSet;
use std::ffi::OsStr;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use tauri::AppHandle;
use tauri::Manager;

use anyhow::Context;
use sha2::Digest;
use sha2::Sha256;

use crate::types::{FileMetadata, ImageSize};

// ---------------------------------------------------------------------------------------------------------------------

/// サムネイル保存用ディレクトリ取得
pub fn get_thumbnail_dir(app: &tauri::AppHandle) -> anyhow::Result<PathBuf> {
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
pub fn get_thumbnail_fullpath(
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
        .join(&name[0..2]);

    if !path.exists() {
        fs::create_dir_all(&path)
            .context(format!("fail create thumbnail cache dir: {:?}", path))?;
    }

    let tmp = format!("_tmp_{}.jpg", uuid::Uuid::new_v4());
    Ok((path.join(&name), path.join(tmp)))
}

pub fn is_picture_ext<P: AsRef<Path>>(p: P) -> bool {
    // 静的に保持する拡張子セット
    static EXTENSIONS: &[&str] = &[
        "AVIF", "BMP", "DDS", "EXR", "GIF", "HDR", "ICO", "JPEG", "JPG", "PNG", "PNM", "pbm",
        "pgm", "ppm", "QOI", "TGA", "TIFF", "TIF", "WebP",
    ];
    // HashSet を lazy static 的に初期化
    use std::sync::OnceLock;
    static SET: OnceLock<HashSet<String>> = OnceLock::new();
    let set = SET.get_or_init(|| {
        EXTENSIONS
            .iter()
            .copied()
            .map(|s| s.to_string().to_lowercase())
            .collect()
    });

    p.as_ref()
        .extension()
        .and_then(|s| s.to_str())
        .map(|ext| set.contains(&ext.to_lowercase()))
        .unwrap_or(false)
}
