use std::{
    collections::HashMap,
    env,
    fs::{self},
    io::{self, ErrorKind},
    path::{absolute, Path},
    sync::Mutex,
};

use anyhow::Result;
use tauri::State;

use crate::{
    data::{DirEntry, FileInfo, FileMetadata},
    state::AppState,
    util::to_unix_time,
};

mod data;
mod state;
mod util;

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
fn get_directory_entries(
    state: State<'_, AppState>,
    path: String,
) -> Result<(String, Vec<DirEntry>), String> {
    let path = get_directory_entries_impl(&state, path).map_err(|e| e.to_string())?;
    Ok((path, state.get_dir_entries()))
}
//
fn get_directory_entries_impl(state: &State<'_, AppState>, path: String) -> Result<String> {
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
fn get_file_info(state: State<'_, AppState>, id: u64) -> Result<Option<FileInfo>, String> {
    let mut map = state.item_map.lock().unwrap();

    let info = match map.get_mut(&id) {
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

// ---------------------------------------------------------------------------------------------------------------------
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            new_id: Mutex::new(0),
            item_map: Mutex::new(HashMap::new()),
            item_list: Mutex::new(Vec::new()),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_directory_entries,
            get_file_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
