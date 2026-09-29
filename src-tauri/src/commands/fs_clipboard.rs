use std::sync::Arc;

use tauri::State;

use crate::{
    commands::{fs_util::cnv_file_ids_to_path, fs_util_move::move_paths},
    state::{
        app_state::AppState,
        clipboard::{self, AppClipboard},
    },
    types::{ClipboardPasteResult, TabId},
    LOG_RESULT,
};

#[tauri::command]
#[specta::specta]
/// ファイルを Ctrl+X
pub fn file_cut_clipboard(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
    file_ids: Vec<String>,
) -> Result<(), String> {
    LOG_RESULT!(
        format!("file_cut_clipboard({},[{}])", tab_id, file_ids.len()),
        { file_cut_clipboard_impl(&state, tab_id, &file_ids).map_err(|e| e.to_string()) }
    )
}

pub fn file_cut_clipboard_impl(
    state: &Arc<AppState>,
    tab_id: TabId,
    file_ids: &[String],
) -> anyhow::Result<()> {
    let paths = cnv_file_ids_to_path(state, tab_id, file_ids)?;
    let mut clip = arboard::Clipboard::new()?;
    clip.set().file_list(&paths)?;

    let mut app_clip = state.clipboard.lock().unwrap();
    *app_clip = Some(AppClipboard::new(
        crate::state::clipboard::CutOrCopy::Cut,
        paths,
    ));

    Ok(())
}

#[tauri::command]
#[specta::specta]
/// ファイルを Ctrl+V
pub fn file_paste_clipboard(
    state: State<'_, Arc<AppState>>,
    tab_id: TabId,
) -> Result<ClipboardPasteResult, String> {
    LOG_RESULT!(format!("file_paste_clipboard({})", tab_id), {
        file_paste_clipboard_impl(&state, tab_id).map_err(|e| e.to_string())
    })
}
pub fn file_paste_clipboard_impl(
    state: &Arc<AppState>,
    tab_id: TabId,
) -> anyhow::Result<ClipboardPasteResult> {
    let paths = {
        let mut clip = arboard::Clipboard::new()?;
        match clip.get().file_list() {
            Ok(p) => p,
            Err(_) => return Ok(ClipboardPasteResult::NoFiles),
        }
    };

    // デフォルトはコピーモード
    let mut mode = clipboard::CutOrCopy::Copy;
    {
        let mut app_clip = state.clipboard.lock().unwrap();
        match &*app_clip {
            None => {}
            Some(c) => {
                if c.equal_paths(&paths) {
                    // このアプリ内で作られたクリップボードとみなして、Ctrl+X or Ctrl+C を判定する
                    mode = c.mode;
                } else {
                    // アプリ外から来たクリップボードなら、アプリ内部の情報をクリアする
                    *app_clip = None;
                }
            }
        }
    }

    match mode {
        clipboard::CutOrCopy::Copy => {
            log::error!("copy not implemented: {:?}", paths);
            // TODO
            Ok(ClipboardPasteResult::ProgressCopy)
        }
        clipboard::CutOrCopy::Cut => {
            let tab = state.get_tab(tab_id)?;
            let tab = tab.read().unwrap();
            move_paths(&paths, tab.get_path())?;
            Ok(ClipboardPasteResult::ProgressCut)
        }
    }
}
