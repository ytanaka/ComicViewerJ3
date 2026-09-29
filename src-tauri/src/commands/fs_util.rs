//! [`fs`](super::fs) で使用する関数

use std::{path::PathBuf, sync::Arc};

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
