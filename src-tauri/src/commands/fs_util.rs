//! [`fs`](super::fs) で使用する関数

use std::{
    path::{Path, PathBuf},
    sync::Arc,
};

use anyhow::anyhow;

use crate::{
    state::app_state::AppState,
    types::{FileId, FileInfoOS, TabId},
};

pub fn get_tab_path(state: &AppState, tab_id: TabId) -> anyhow::Result<PathBuf> {
    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();
    Ok(tab.get_path().to_path_buf())
}

pub fn get_tab_file(
    state: &AppState,
    tab_id: TabId,
    file_id: FileId,
) -> anyhow::Result<(PathBuf, FileInfoOS)> {
    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();
    let ret = tab.get_file_info(file_id)?;
    Ok((tab.get_path().to_path_buf(), ret.clone()))
}

pub fn parse_file_id_str(file_id: &str) -> anyhow::Result<u64> {
    file_id
        .parse()
        .map_err(|_| anyhow!("invalid file_id as u64"))
}

pub fn is_valid_filename(name: &str) -> bool {
    #[cfg(target_os = "windows")]
    {
        !name.chars().any(|c| {
            matches!(c, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*') || c.is_control()
        })
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        !name.chars().any(|c| c == '/' || c == '\0')
    }
}

pub fn cnv_file_ids_to_path(
    state: &Arc<AppState>,
    tab_id: TabId,
    file_ids: &[String],
) -> anyhow::Result<Vec<PathBuf>> {
    let tab = state.get_tab(tab_id)?;
    let tab = tab.read().unwrap();
    let file_ids: Result<Vec<_>, _> = file_ids.iter().map(|s| parse_file_id_str(s)).collect();
    let mut paths = Vec::<PathBuf>::new();
    for file_id in file_ids? {
        let f = tab.get_file_info(file_id)?;
        paths.push(tab.get_path().join(&*f.name));
    }
    Ok(paths)
}

/// コピー／移動元と先の衝突を解決するパスを取得する
/// # Parameter
/// * `src_path`: 元フルパス
/// * `dst_path`: 先フルパス
/// # Return
/// `src_path` のファイル名を改変して、`dst_path` のファイル名を置き換えたフルパス (存在しないフルパスを返す)
pub fn resolv_conflict_name(
    src_path: impl AsRef<Path>,
    dst_path: impl AsRef<Path>,
) -> anyhow::Result<PathBuf> {
    let mut i = 1;
    let src_filename = get_file_name(src_path)?.to_string_lossy().to_string();
    let dst_dir = get_parent(dst_path)?;

    loop {
        let name2 = format!("コピー({}) {}", i, src_filename);
        let dst_path2 = dst_dir.join(name2);
        if !dst_path2.exists() {
            return Ok(dst_path2);
        }
        i += 1;
    }
}

pub fn get_file_name(path: impl AsRef<Path>) -> anyhow::Result<PathBuf> {
    let name = path
        .as_ref()
        .file_name()
        .ok_or(anyhow!("不正なパス: {:?}", path.as_ref()))?;
    Ok(PathBuf::from(name))
}
pub fn get_parent(path: impl AsRef<Path>) -> anyhow::Result<PathBuf> {
    let parent = path
        .as_ref()
        .parent()
        .ok_or(anyhow!("不正なパス: {:?}", path.as_ref()))?;
    Ok(parent.to_path_buf())
}
