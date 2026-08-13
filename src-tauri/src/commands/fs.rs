use std::{
    fs::{self},
    io::{self, ErrorKind},
    path::Path,
};

use tauri::State;

use crate::{
    state::AppState,
    types::{DirEntry, FileInfo, FileMetadata},
    util::{to_unix_time, try_u64},
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn get_dir_entries(state: State<'_, AppState>, path: String) -> Result<Vec<DirEntry>, String> {
    log::trace!("get_dir_entries({path})");
    get_dir_entries_impl(&state, path).map_err(|e| e.to_string())
}
fn get_dir_entries_impl(
    state: &State<'_, AppState>,
    path: String,
) -> anyhow::Result<Vec<DirEntry>> {
    let path = Path::new(&path);
    if !path.is_dir() {
        return Err(io::Error::new(
            ErrorKind::NotADirectory,
            path.to_string_lossy(),
        ))?;
    }

    let list = get_dir_entries_impl2(state, &path)?;
    let mut file_infos = state.file_infos.lock().unwrap();
    file_infos.set_files(list);
    Ok(file_infos.get_dir_entries())
}
fn get_dir_entries_impl2(
    state: &State<'_, AppState>,
    path: &Path,
) -> anyhow::Result<Vec<FileInfo>> {
    let mut list = Vec::<FileInfo>::new();
    let mut new_id = state.new_file_id.lock().unwrap();
    for entry in fs::read_dir(&path)? {
        let entry = entry?;
        *new_id += 1;

        let info = FileInfo {
            id: *new_id,
            path: entry.path(),
            metadata: None,
        };
        list.push(info);
    }

    Ok(list)
}

// ---------------------------------------------------------------------------------------------------------------------
// id は u64 にしたかったが、tauri_specta でエラーになるので文字列にする
#[tauri::command]
#[specta::specta]
pub fn get_file_info(state: State<'_, AppState>, id: &str) -> Result<FileInfo, String> {
    log::trace!("get_file_info({id})");

    let map = &mut state.file_infos.lock().unwrap().map;
    let info = match map.get_mut(&try_u64(id)?) {
        None => return Err(format!("invalid file id: {}", id)),
        Some(i) => match i.path.metadata() {
            Err(e) => return Err(e.to_string()),
            Ok(m) => {
                i.metadata = Some(FileMetadata {
                    is_dir: m.is_dir(),
                    size: Some(m.len()),
                    created: to_unix_time(m.created()),
                    modified: to_unix_time(m.modified()),
                    accessed: to_unix_time(m.accessed()),
                });
                i
            }
        },
    };
    Ok(info.clone())
}
