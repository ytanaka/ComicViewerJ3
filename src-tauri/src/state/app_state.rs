//! [`State`](https://docs.rs/tauri/2.12.0/tauri/struct.State.html) でRustコマンドに渡される構造体

use std::{
    ops::Deref,
    sync::{
        atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering::SeqCst},
        Arc, Mutex, OnceLock, RwLock, Weak,
    },
};

use anyhow::anyhow;
use dashmap::DashMap;
use tauri::AppHandle;

use crate::{
    commands::preferences::load_preferences_impl,
    file_operations::{cache_cleaner::CacheCleanupWorker, metadata_worker::MetadataWorker},
    state::{clipboard::AppClipboard, command_limitter::CommandLimitter, tab_info::TabInfo},
    text_search::{
        migemo::Migemo, reverse_migemo::ReverseMigemo, romaji_cnv::RomajiCnv,
        text_matcher::TextMatcher, vibrato::Vibrato,
    },
    types::{AppPreferences, FileId, TabId, TaskId},
};

// =====================================================================================================================

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

// =====================================================================================================================

pub const START_TAB_ID: TabId = 1;
pub const START_FILE_ID: FileId = 1001;

pub struct AppTask {
    pub canceled: AtomicBool,
}
impl AppTask {
    fn new() -> Arc<Self> {
        Arc::new(Self {
            canceled: AtomicBool::new(false),
        })
    }
}

pub struct AppState {
    pub next_tab_id: AtomicU32,  // TabId の採番 (アプリ内で起動時からユニーク)
    pub next_file_id: AtomicU64, // FileId の採番 (アプリ内で起動時からユニーク)

    pub current_tasks: DashMap<TaskId, Weak<AppTask>>,

    // UIのタブ情報
    pub tabs: DashMap<TabId, Arc<RwLock<TabInfo>>>,

    // クリップボード
    pub clipboard: AppStateField<Mutex<Option<AppClipboard>>>,

    // 設定
    pub preferences: AppStateField<RwLock<AppPreferences>>,

    // 形態素解析
    pub reverse_migemo: AppStateField<ReverseMigemo>,
    pub vibrato: AppStateField<Vibrato>,
    pub migemo: AppStateField<Migemo>,
    pub romaji_cnv: AppStateField<RomajiCnv>,
    pub text_matcher: AppStateField<TextMatcher>,

    pub metadata_worker: AppStateField<MetadataWorker>,
    pub cache_cleanup_worker: AppStateField<CacheCleanupWorker>,

    pub thumbnail_command_limitter: AppStateField<CommandLimitter>,
    pub resize_img_command_limitter: AppStateField<CommandLimitter>,
}
impl AppState {
    pub fn new() -> Self {
        AppState {
            next_tab_id: AtomicU32::new(START_TAB_ID),
            next_file_id: AtomicU64::new(START_FILE_ID),

            current_tasks: DashMap::new(),

            tabs: DashMap::new(),

            clipboard: AppStateField::new(),
            preferences: AppStateField::new(),

            reverse_migemo: AppStateField::new(),
            vibrato: AppStateField::new(),
            migemo: AppStateField::new(),
            romaji_cnv: AppStateField::new(),
            text_matcher: AppStateField::new(),

            metadata_worker: AppStateField::new(),
            cache_cleanup_worker: AppStateField::new(),

            thumbnail_command_limitter: AppStateField::new(),
            resize_img_command_limitter: AppStateField::new(),
        }
    }

    pub fn init(&self, app: Arc<AppHandle>, state: Arc<AppState>) {
        // アプリ中で使用するので読み込んでおく
        state
            .preferences
            .get_or_init(|| Arc::new(RwLock::new(AppPreferences::default())));
        if let Err(e) = load_preferences_impl(&app, &state) {
            log::error!("AppState::init() error: load_preferences_impl => {}", e);
        }
        let pref = self.preferences.read().unwrap().clone();

        state.clipboard.get_or_init(|| Arc::new(Mutex::new(None)));
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
            .cache_cleanup_worker
            .get_or_init(|| CacheCleanupWorker::new(app.clone(), state.clone()));

        state
            .thumbnail_command_limitter
            .get_or_init(|| Arc::new(CommandLimitter::new(pref.thumbnail_command_limit)));
        state
            .resize_img_command_limitter
            .get_or_init(|| Arc::new(CommandLimitter::new(pref.resize_image_command_limit)));
    }
    pub fn stop(&self) {}

    #[cfg(test)]
    pub fn init_for_test(&self) {
        self.preferences
            .get_or_init(|| Arc::new(RwLock::new(AppPreferences::default())));
    }
    pub fn is_initialized(&self) -> bool {
        self.text_matcher.get().is_some()
    }

    pub fn get_tab(&self, tab_id: TabId) -> anyhow::Result<Arc<RwLock<TabInfo>>> {
        let ret = self
            .tabs
            .get_mut(&tab_id)
            .ok_or_else(|| anyhow!("no tab id:{tab_id}"))?;
        Ok(ret.clone())
    }
    pub fn has_tab(&self, tab_id: TabId) -> bool {
        let ret = self.tabs.get(&tab_id);
        ret.is_some()
    }

    pub fn get_tab_ids(&self) -> Vec<TabId> {
        let mut ret: Vec<_> = self.tabs.iter().map(|elm| *elm.key()).collect();
        ret.sort();
        ret
    }

    pub fn add_task(&self, task_id: TaskId) -> Arc<AppTask> {
        let task = AppTask::new();
        self.current_tasks.insert(task_id, Arc::downgrade(&task));
        self.current_tasks.retain(|_, v| v.upgrade().is_some()); // 不要になったタスクを消す
        task
    }
    pub fn cancel_task(&self, task_id: TaskId) {
        match self.current_tasks.get(&task_id).and_then(|t| t.upgrade()) {
            None => log::warn!("no task for cancel: id={}", task_id),
            Some(t) => t.canceled.store(true, SeqCst),
        }
    }
    pub fn is_task_canceled(&self, task_id: TaskId) -> bool {
        match self.current_tasks.get(&task_id).and_then(|t| t.upgrade()) {
            None => true,
            Some(t) => t.canceled.load(SeqCst),
        }
    }
}
