use std::sync::{atomic::AtomicU32, Arc, OnceLock, RwLock};

use anyhow::anyhow;
use dashmap::DashMap;
use tauri::State;

use crate::{
    state::tab_info::TabInfo,
    text_search::{
        migemo::Migemo, reverse_migemo::ReverseMigemo, romaji_cnv::RomajiCnv,
        text_matcher::TextMatcher, vibrato::Vibrato,
    },
    types::TabId,
};

pub struct AppState {
    // UIのタブ情報
    pub next_tab_id: AtomicU32,
    pub tabs: DashMap<TabId, Arc<RwLock<TabInfo>>>,

    // 形態素解析
    pub reverse_migemo: OnceLock<Arc<ReverseMigemo>>,
    pub vibrato: OnceLock<Arc<Vibrato>>,
    pub migemo: OnceLock<Arc<Migemo>>,
    pub romaji_cnv: Arc<RomajiCnv>,
    pub text_matcher: OnceLock<Arc<TextMatcher>>,
}
impl AppState {
    pub fn new() -> Self {
        AppState {
            next_tab_id: AtomicU32::new(1),
            tabs: DashMap::new(),

            reverse_migemo: OnceLock::new(),
            vibrato: OnceLock::new(),
            migemo: OnceLock::new(),
            romaji_cnv: Arc::new(RomajiCnv::new()),

            text_matcher: OnceLock::new(),
        }
    }

    pub fn init(&self) {
        self.reverse_migemo
            .get_or_init(|| Arc::new(ReverseMigemo::new()));

        self.vibrato.get_or_init(|| Arc::new(Vibrato::new()));

        self.migemo.get_or_init(|| Arc::new(Migemo::new()));

        self.text_matcher.get_or_init(|| TextMatcher::new(&self));
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
