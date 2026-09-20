use std::ffi::OsStr;
use std::fmt;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use tauri::AppHandle;
use tauri::Manager;

use anyhow::Context;
use sha2::Digest;
use sha2::Sha256;

use crate::types::{FileMetadata, Dimension};

pub enum ImageCacheType {
    ResizedImage,
    Thumbnail,
}
impl fmt::Display for ImageCacheType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::ResizedImage => "ResizedImage",
            Self::Thumbnail => "Thumbnail",
        };
        write!(f, "{}", s)
    }
}
impl ImageCacheType {
    pub fn get_ext(&self) -> &str {
        match self {
            Self::ResizedImage => "bmp",
            Self::Thumbnail => "png",
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------

/// 画像キャッシュ保存用ディレクトリ取得
pub fn get_imgcache_dir(
    app: &tauri::AppHandle,
    subdir: &ImageCacheType,
) -> anyhow::Result<PathBuf> {
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

// return (画像キャッシュファイル名、セーブ時の一時ファイル名)
pub fn get_imgcache_fullpath(
    app: &AppHandle,
    subdir: &ImageCacheType,
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
    let name = format!("{}.{}", hex::encode(result), subdir.get_ext());

    // "/略/app_cache_dir()/Thumbnail/{size}/FF"
    // "/略/app_cache_dir()/ResizedImage/{size}"
    let path = get_imgcache_dir(app, &subdir)?.join(format!("{}", size.max()));
    let path = match subdir {
        ImageCacheType::Thumbnail => path.join(&name[0..2]),
        ImageCacheType::ResizedImage => path,
    };

    if !path.exists() {
        fs::create_dir_all(&path)
            .context(format!("fail create {} cache dir: {:?}", subdir, path))?;
    }

    let tmp = format!("_tmp_{}.{}", uuid::Uuid::new_v4(), subdir.get_ext());
    Ok((path.join(&name), path.join(tmp)))
}
