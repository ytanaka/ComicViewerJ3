use std::sync::{atomic::AtomicU32, Arc, OnceLock, RwLock};

use anyhow::anyhow;
use dashmap::DashMap;

use crate::{
    state::tab_info::TabInfo,
    text_search::{
        migemo::Migemo, reverse_migemo::ReverseMigemo, romaji_cnv::RomajiCnv,
        text_matcher::TextMatcher, vibrato::Vibrato,
    },
    types::{AppPreferences, TabId},
};

pub struct AppState {
    // UIのタブ情報
    pub next_tab_id: AtomicU32,
    pub tabs: DashMap<TabId, Arc<RwLock<TabInfo>>>,

    // 形態素解析
    reverse_migemo: OnceLock<Arc<ReverseMigemo>>,
    vibrato: OnceLock<Arc<Vibrato>>,
    migemo: OnceLock<Arc<Migemo>>,
    romaji_cnv: OnceLock<Arc<RomajiCnv>>,
    text_matcher: OnceLock<Arc<TextMatcher>>,

    // 設定
    preferences: OnceLock<Arc<RwLock<AppPreferences>>>,
}
impl AppState {
    pub fn get_reverse_migemo(&self) -> Arc<ReverseMigemo> {
        self.reverse_migemo.get().unwrap().clone()
    }
    pub fn get_vibrato(&self) -> Arc<Vibrato> {
        self.vibrato.get().unwrap().clone()
    }
    pub fn get_migemo(&self) -> Arc<Migemo> {
        self.migemo.get().unwrap().clone()
    }
    pub fn get_romaji_cnv(&self) -> Arc<RomajiCnv> {
        self.romaji_cnv.get().unwrap().clone()
    }
    pub fn get_text_matcher(&self) -> Arc<TextMatcher> {
        self.text_matcher.get().unwrap().clone()
    }
    pub fn get_preferences_read(&self) -> std::sync::RwLockReadGuard<'_, AppPreferences> {
        self.preferences.get().unwrap().read().unwrap()
    }
    pub fn get_preferences_write(&self) -> std::sync::RwLockWriteGuard<'_, AppPreferences> {
        self.preferences.get().unwrap().write().unwrap()
    }
}
impl AppState {
    pub fn new() -> Self {
        AppState {
            next_tab_id: AtomicU32::new(1),
            tabs: DashMap::new(),

            reverse_migemo: OnceLock::new(),
            vibrato: OnceLock::new(),
            migemo: OnceLock::new(),
            romaji_cnv: OnceLock::new(),
            text_matcher: OnceLock::new(),

            preferences: OnceLock::new(),
        }
    }

    pub fn init(&self, state: Arc<AppState>) {
        state
            .reverse_migemo
            .get_or_init(|| Arc::new(ReverseMigemo::new()));

        state.vibrato.get_or_init(|| Arc::new(Vibrato::new()));

        state.migemo.get_or_init(|| Arc::new(Migemo::new()));

        state.romaji_cnv.get_or_init(|| Arc::new(RomajiCnv::new()));

        state
            .text_matcher
            .get_or_init(|| TextMatcher::new(state.clone()));

        state
            .preferences
            .get_or_init(|| Arc::new(RwLock::new(AppPreferences::default())));
    }
    pub fn is_initialized(&self) -> bool {
        self.text_matcher.get().is_some()
    }

    pub fn get_tab(&self, tab_id: TabId) -> anyhow::Result<Arc<RwLock<TabInfo>>> {
        let ret = self
            .tabs
            .get_mut(&tab_id)
            .ok_or_else(|| anyhow!("invalid tab_id: {tab_id}"))?;
        Ok(ret.clone())
    }

    pub fn get_tab_ids(&self) -> Vec<TabId> {
        let mut ret: Vec<_> = self.tabs.iter().map(|elm| *elm.key()).collect();
        ret.sort();
        ret
    }
}
