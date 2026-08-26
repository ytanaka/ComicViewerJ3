use std::sync::Arc;

use tauri::{AppHandle, State};

use crate::{
    state::app_state::AppState,
    text_search::{
        migemo::Migemo, reverse_migemo::ReverseMigemo, text_matcher::TextMatcher,
        vibrato::Vibrato,
    },
};

#[tauri::command]
#[specta::specta]
/// アプリ終了
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
#[specta::specta]
pub fn init(state: State<'_, AppState>) {
    state.migemo.get_or_init(|| Arc::new(Migemo::new()));
    state
        .reverse_migemo
        .get_or_init(|| Arc::new(ReverseMigemo::new()));
    state.vibrato.get_or_init(|| Arc::new(Vibrato::new()));
    state.text_matcher.get_or_init(|| TextMatcher::new(&state));
}
