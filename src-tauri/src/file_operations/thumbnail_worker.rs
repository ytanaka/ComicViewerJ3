use anyhow::Context;
use std::{
    fs,
    path::PathBuf,
    sync::Arc,
    thread,
    time::{Duration, SystemTime},
};
use tauri::Manager;
use walkdir::WalkDir;

use crate::state::app_state::AppState;

// ---------------------------------------------------------------------------------------------------------------------

// 1回全チェックした後、次に実行するまでの時間
const THUMBNAIL_CLEANER_INTERVAL_HOURS: u64 = 3;
// １回のループでチェックするファイル数
const THUMBNAIL_CLEANER_BATCH_FILE_NUM: u64 = 100;
// １回のループするごとのスリープ時間
const THUMBNAIL_CLEANER_BATCH_SLEEP_MS: u64 = 100;

// ---------------------------------------------------------------------------------------------------------------------

/// サムネイル保存用ディレクトリ取得
pub fn get_thumbnail_dir(app: &tauri::AppHandle) -> anyhow::Result<PathBuf> {
    let resolver = app.path();
    let p = resolver
        .app_cache_dir()
        .context("fail get thumbnail cache dir: error")?;
    let p = p.join("thumbnails");

    if !p.is_dir() {
        log::info!("mkdir thumbnail dir: {}", p.to_string_lossy());
        fs::create_dir_all(&p).context("fail create thumbnail cache dir")?;
    }
    Ok(p)
}

// ---------------------------------------------------------------------------------------------------------------------

// サムネイルファイル削除ワーカースレッド
pub struct ThumbnailCleanupWorker {}
impl ThumbnailCleanupWorker {
    pub fn new(app: tauri::AppHandle, state: Arc<AppState>) -> Arc<Self> {
        thread::spawn(move || loop {
            if let Err(e) = exec(app.clone(), state.clone()) {
                log::error!("spawn_thumbnail_cleanup_worker: error {}", e);
            }
            thread::sleep(Duration::from_hours(THUMBNAIL_CLEANER_INTERVAL_HOURS));
        });
        Arc::new(ThumbnailCleanupWorker {})
    }
}

fn exec(app: tauri::AppHandle, state: Arc<AppState>) -> anyhow::Result<()> {
    log::info!("spawn_thumbnail_cleanup_worker: start");
    let mut n: u64 = 0;
    for walk in WalkDir::new(get_thumbnail_dir(&app)?) {
        let f = walk?;
        let meta = f.metadata()?;
        if meta.is_file() {
            let file_time = meta.created()?;
            let now = SystemTime::now();
            let diff = now
                .duration_since(file_time)
                .map(|t| t.as_secs())
                .unwrap_or(0);
            let limit = state
                .preferences
                .read()
                .unwrap()
                .thumbnail_expiration_seconds;
            if limit < diff as i32 {
                fs::remove_file(f.path())?;
                log::trace!("spawn_thumbnail_cleanup_worker: remove file {:?}", f.path());
            }
        };
        n += 1;
        if THUMBNAIL_CLEANER_BATCH_FILE_NUM % n == 0 {
            thread::sleep(Duration::from_millis(THUMBNAIL_CLEANER_BATCH_SLEEP_MS));
        }
    }
    log::info!("spawn_thumbnail_cleanup_worker: end. file num = {}", n);
    Ok(())
}
