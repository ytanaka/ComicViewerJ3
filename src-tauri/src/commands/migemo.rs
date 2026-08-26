use tauri::State;

use crate::{state::app_state::AppState, types::TabId};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
///
pub fn search_next_filename(
    state: State<'_, AppState>,
    tab_id: TabId,
    start_index: u32,
    romaji: String,
) -> Option<u32> {
    Some(start_index)
}
