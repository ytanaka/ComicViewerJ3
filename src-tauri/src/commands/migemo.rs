use std::{sync::Arc, time::Instant};

use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use tauri::State;

use crate::{
    state::app_state::AppState,
    text_search::util::normalize_str,
    types::{FileId, FileSearchResult, TabId},
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
    reverse: bool,
) -> Result<FileSearchResult, String> {
    let t0 = Instant::now();
    let comment = format!(
        "search_next_filename({}, {}, {})",
        tab_id, start_index, romaji
    );
    let state2 = state.inner().clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        search_next_filename_impl(&state2, tab_id, start_index, romaji, reverse)
            .map_err(|e| e.to_string())
    });
    let result = result.await.unwrap();
    log::trace!("{}: {:?}, {}ms", comment, result, t0.elapsed().as_millis());
    result
}

fn search_next_filename_impl(
    state: &AppState,
    tab_id: TabId,
    start_index: u32,
    romaji: String,
    reverse: bool,
) -> anyhow::Result<FileSearchResult> {
    let katakana = state.romaji_cnv.cnv(&romaji);
    let migemo_re = state.migemo.get().unwrap().get_query_regex(&romaji);
    let romaji = normalize_str(&romaji); // ローマ字以外が送られてくるかもしれないので、正規化しておく

    // start_index から開始して一周するFileIdのリストを作る
    let (sort_generation, file_ids): (_, Vec<_>) = {
        let tab = state.get_tab(tab_id)?;
        let mut tab = tab.write().unwrap();
        let sorted_list = tab.get_sorted_list();
        (
            tab.get_sort_generation(),
            mk_search_list(sorted_list, start_index, reverse),
        )
    };

    // チャンクに分割して並列検索する
    for file_ids_2 in file_ids.chunks(100) {
        // ファイルIDをファイル名に変換する
        let filenames = {
            let tab = state.get_tab(tab_id)?;
            let tab = tab.write().unwrap();
            if tab.get_sort_generation() != sort_generation {
                // ソート状態が変わったら検索する意味がないので、キャンセル
                return Ok(FileSearchResult::Canceled);
            }
            let ret: Vec<_> = file_ids_2
                .par_iter()
                .flat_map(|(index, file_id)| tab.get_file(*file_id).map(|n| (*index, n.name)))
                .collect();
            ret
        };

        // NoMach は無視して、最初に NoCache | Success になるファイル名を探す
        let chunk_result = filenames
            .par_iter()
            .flat_map(|(index, name)| {
                let name = name.to_string_lossy();
                let matcher = state.text_matcher.get().unwrap();
                if !matcher.has_cache(&name) {
                    return Some(FileSearchResult::FailNoCache);
                }
                if let Some(find) = matcher.find(&katakana, &migemo_re, &romaji, &name) {
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

// ファイル検索をする順序を取得する
// list: UIに表示されているファイルリスト
// s_idx: 検索開始位置
// return: Vec[list内の元インデックス, list要素のFileId] に変換する
fn mk_search_list(list: Vec<FileId>, s_idx: u32, reverse: bool) -> Vec<(usize, FileId)> {
    let ret: Vec<_> = if reverse {
        // [ <=== start | end <=== ]
        let list1 = list.iter().enumerate().take((s_idx + 1) as usize).rev();
        let list2 = list.iter().enumerate().skip((s_idx + 1) as usize).rev();
        let list = list1.chain(list2);
        list.collect()
    } else {
        // [ ===> end | start ===> ]
        let list1 = list.iter().enumerate().skip(s_idx as usize);
        let list2 = list.iter().enumerate().take(s_idx as usize);
        let list = list1.chain(list2);
        list.collect()
    };
    ret.iter().map(|kv| (kv.0, *kv.1)).collect()
}

// =================================================================================================
// =================================================================================================
// =================================================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn mk_list() -> Vec<u64> {
        vec![0, 1, 2, 3, 4]
    }
    fn get_tuple_0(list: Vec<(usize, u64)>) -> Vec<usize> {
        list.iter()
            .map(|kv| {
                assert_eq!(kv.0, kv.1 as usize);
                kv.0
            })
            .collect()
    }
    fn mk_result(s_idx: u32, reverse: bool) -> Vec<usize> {
        get_tuple_0(mk_search_list(mk_list(), s_idx, reverse))
    }

    #[test]
    fn test_mk_search_list() {
        assert_eq!(mk_result(0, false), vec![0, 1, 2, 3, 4]);
        assert_eq!(mk_result(1, false), vec![1, 2, 3, 4, 0]);
        assert_eq!(mk_result(3, false), vec![3, 4, 0, 1, 2]);
        assert_eq!(mk_result(4, false), vec![4, 0, 1, 2, 3]);

        assert_eq!(mk_result(0, true), vec![0, 4, 3, 2, 1]);
        assert_eq!(mk_result(1, true), vec![1, 0, 4, 3, 2]);
        assert_eq!(mk_result(3, true), vec![3, 2, 1, 0, 4]);
        assert_eq!(mk_result(4, true), vec![4, 3, 2, 1, 0]);
    }
}
