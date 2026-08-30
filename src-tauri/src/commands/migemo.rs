use std::sync::Arc;

use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use tauri::State;

use crate::{
    state::app_state::AppState,
    text_search::util::normalize_str,
    types::{FileSearchResult, TabId},
};

// ---------------------------------------------------------------------------------------------------------------------
#[tauri::command]
#[specta::specta]
/// ローマ字入力からファイル名をあいまい検索
pub async fn search_next_filename(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    start_index: u32,
    romaji: String,
) -> Result<FileSearchResult, String> {
    let comment = format!(
        "search_next_filename({}, {}, {})",
        tab_id, start_index, romaji
    );
    let state2 = state.inner().clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        search_next_filename_impl(&state2, tab_id, start_index, romaji).map_err(|e| e.to_string())
    });
    let result = result.await.unwrap();
    log::trace!("{}: {:?}", comment, result);
    result
}

fn search_next_filename_impl(
    state: &AppState,
    tab_id: TabId,
    start_index: u32,
    romaji: String,
) -> anyhow::Result<FileSearchResult> {
    let katakana = state.romaji_cnv.cnv(&romaji);
    let migemo_re = state.migemo.get().unwrap().get_query_regex(&romaji);
    let normalized_romaji = normalize_str(&romaji);

    // [start_index -> 最後] + [0 -> start_index] で、FileIdのリストを作る (tab のロックを最小限にする)
    let list: Vec<_> = {
        let tab = state.get_tab(tab_id)?;
        let mut tab = tab.write().unwrap();
        let sorted_list = tab.get_sorted_list();
        let list1 = sorted_list.iter().enumerate().skip(start_index as usize);
        let list2 = sorted_list.iter().enumerate().take(start_index as usize);
        let list = list1.chain(list2);
        list.flat_map(|(index, file_id)| {
            tab.get_file(*file_id)
                .map(|f| (index, f.name.to_string_lossy().to_string()))
        })
        .collect()
    };

    // チャンクに分割して並列検索する
    for list2 in list.chunks(100) {
        // NoMach は無視して、最初に NoCache | Success になるファイル名を探す
        let chunk_result = list2
            .par_iter()
            .flat_map(|(index, name)| {
                let matcher = state.text_matcher.get().unwrap();
                if !matcher.has_cache(&name) {
                    return Some(FileSearchResult::FailNoCache);
                }
                if let Some(find) = matcher.find(&katakana, &migemo_re, &normalized_romaji, &name) {
                    return Some(FileSearchResult::new_success(*index, &name, find.0, find.1));
                }
                None
            })
            .find_first(|_| true);

        if let Some(r) = chunk_result {
            return Ok(r);
        }
    }

    Ok(FileSearchResult::FailNoMatch)
}
