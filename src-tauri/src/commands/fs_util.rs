use std::path::PathBuf;

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
