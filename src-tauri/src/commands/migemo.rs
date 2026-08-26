use tauri::State;

use crate::{
    state::app_state::AppState,
    text_search::util::normalize_str,
    types::{FileSearchResult, TabId},
    LOG_RESULT,
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ローマ字入力からファイル名をあいまい検索
pub fn search_next_filename(
    state: State<'_, AppState>,
    tab_id: TabId,
    start_index: usize,
    romaji: String,
) -> Result<Option<FileSearchResult>, String> {
    LOG_RESULT!(
        format!(
            "search_next_filename({}, {}, {})",
            tab_id, start_index, romaji
        ),
        {
            search_next_filename_impl(&state, tab_id, start_index, romaji)
                .map_err(|e| e.to_string())
        }
    )
}

fn search_next_filename_impl(
    state: &AppState,
    tab_id: TabId,
    start_index: usize,
    romaji: String,
) -> anyhow::Result<Option<FileSearchResult>> {
    let katakana = state.romaji_cnv.cnv(&romaji);
    let migemo_re = state.migemo.get().unwrap().get_query_regex(&romaji);
    let normalized_romaji = normalize_str(&romaji);

    let tab = state.get_tab(tab_id)?;
    let mut tab = tab.write().unwrap();

    // [start_index -> 最後] + [0 -> start_index] で、FileIdのリストを作る
    let sorted_list = tab.get_sorted_list();
    let list1 = sorted_list.iter().enumerate().skip(start_index);
    let list2 = sorted_list.iter().enumerate().take(start_index);
    let list = list1.chain(list2);

    for (index, file) in
        list.flat_map(|(index, file_id)| tab.get_file(*file_id).map(|f| (index, f)))
    {
        let matcher = state.text_matcher.get().unwrap();
        let name = file.name.to_string_lossy();
        if let Some(find) = matcher.find(&katakana, &migemo_re, &normalized_romaji, &name) {
            return Ok(Some(FileSearchResult::new(index, &name, find.0, find.1)));
        }
    }

    Ok(None)
}
