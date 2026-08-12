use std::{
    fs::{self},
    io::{self, ErrorKind},
    path::{absolute, Path},
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
pub fn get_dir_entries(
    state: State<'_, AppState>,
    path: String,
) -> Result<(String, Vec<DirEntry>), String> {
    let path = get_dir_entries_impl(&state, path).map_err(|e| e.to_string())?;
    Ok((path, state.get_dir_entries()))
}
fn get_dir_entries_impl(state: &State<'_, AppState>, path: String) -> anyhow::Result<String> {
    let path = absolute(Path::new(&path))?;
    if !path.is_dir() {
        return Err(io::Error::new(
            ErrorKind::NotADirectory,
            path.to_string_lossy(),
        ))?;
    }

    let mut new_id = state.new_id.lock().unwrap();
    let mut list = Vec::<FileInfo>::new();
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
    state.set_files(list);

    Ok(path.to_string_lossy().into_owned())
}

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
pub fn get_file_info(state: State<'_, AppState>, id: &str) -> Result<Option<FileInfo>, String> {
    let mut map = state.item_map.lock().unwrap();

    let info = match map.get_mut(&try_u64(id)?) {
        None => return Ok(None),
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
    Ok(Some(info.clone()))
}
