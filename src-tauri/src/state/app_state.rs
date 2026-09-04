use std::{
    ops::Deref,
    sync::{
        atomic::{AtomicU32, AtomicU64},
        Arc, OnceLock, RwLock,
    },
};

use anyhow::anyhow;
use dashmap::DashMap;

use crate::{
    file_operations::metadata_worker::MetadataWorker,
    state::tab_info::TabInfo,
    text_search::{
        migemo::Migemo, reverse_migemo::ReverseMigemo, romaji_cnv::RomajiCnv,
        text_matcher::TextMatcher, vibrato::Vibrato,
    },
    types::{AppPreferences, FileId, TabId},
};

// AppState のフィールドの多くが OnceLock<Arc<XXX>> だったので、
// state.xxx.get().unwrap() を毎回書かなくてもいいようにするためのクラス
pub struct AppStateField<T> {
    v: OnceLock<Arc<T>>,
}
impl<T> AppStateField<T> {
    fn new() -> Self {
        AppStateField { v: OnceLock::new() }
    }
    pub fn get_or_init<F: FnOnce() -> Arc<T>>(&self, f: F) -> &T {
        self.v.get_or_init(f)
    }
    pub fn get(&self) -> Option<&Arc<T>> {
        self.v.get()
    }
}
impl<T> Deref for AppStateField<T> {
    type Target = Arc<T>;

    fn deref(&self) -> &Self::Target {
        self.v.get().unwrap()
    }
}

pub const START_TAB_ID: TabId = 1;
pub const START_FILE_ID: FileId = 100001;

pub struct AppState {
    pub next_tab_id: AtomicU32,
    pub next_file_id: AtomicU64,

    // UIのタブ情報
    pub tabs: DashMap<TabId, Arc<RwLock<TabInfo>>>,

    // 形態素解析
    pub reverse_migemo: AppStateField<ReverseMigemo>,
    pub vibrato: AppStateField<Vibrato>,
    pub migemo: AppStateField<Migemo>,
    pub romaji_cnv: AppStateField<RomajiCnv>,
    pub text_matcher: AppStateField<TextMatcher>,

    pub metadata_worker: AppStateField<MetadataWorker>,

    // 設定
    pub preferences: AppStateField<RwLock<AppPreferences>>,
}
impl AppState {
    pub fn new() -> Self {
        AppState {
            next_tab_id: AtomicU32::new(START_TAB_ID),
            next_file_id: AtomicU64::new(START_FILE_ID),

            tabs: DashMap::new(),

            reverse_migemo: AppStateField::new(),
            vibrato: AppStateField::new(),
            migemo: AppStateField::new(),
            romaji_cnv: AppStateField::new(),
            text_matcher: AppStateField::new(),

            metadata_worker: AppStateField::new(),

            preferences: AppStateField::new(),
        }
    }

    pub fn init(&self, state: Arc<AppState>) {
        state.reverse_migemo.get_or_init(ReverseMigemo::new);
        state.vibrato.get_or_init(Vibrato::new);
        state.migemo.get_or_init(Migemo::new);
        state.romaji_cnv.get_or_init(RomajiCnv::new);
        state
            .text_matcher
            .get_or_init(|| TextMatcher::new(state.clone()));
        state
            .metadata_worker
            .get_or_init(|| MetadataWorker::new(state.clone()));
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
