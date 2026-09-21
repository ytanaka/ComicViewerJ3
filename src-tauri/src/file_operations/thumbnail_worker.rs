use std::{fs, sync::Arc, thread, time::Duration};

use walkdir::WalkDir;

use crate::{ commands::images_util::get_thumbnail_dir, state::app_state::AppState};

// ---------------------------------------------------------------------------------------------------------------------

// 1回全チェックした後、次に実行するまでの時間
const THUMBNAIL_CLEANER_INTERVAL_HOURS: u64 = 3;
// １回のループでチェックするファイル数
const THUMBNAIL_CLEANER_BATCH_FILE_NUM: u64 = 100;
// １回のループするごとのスリープ時間
const THUMBNAIL_CLEANER_BATCH_SLEEP_MS: u64 = 100;

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
    let limit_sec = state.preferences.read().unwrap().thumbnail_expiration_days as u64 * 24 * 3600;
    let mut total_file: u64 = 0;
    let mut total: u64 = 0;
    let mut removed: u64 = 0;

    for walk in WalkDir::new(get_thumbnail_dir(&app)?) {
        let f = walk?;
        let meta = f.metadata()?;
        if meta.is_file() {
            let elapsed_sec = meta.modified()?.elapsed()?.as_secs();
            if limit_sec < elapsed_sec {
                fs::remove_file(f.path())?;
                removed += 1;
                log::trace!("spawn_thumbnail_cleanup_worker: remove file {:?}", f.path());
            }
            total_file += 1;
        };
        total += 1;
        if total.is_multiple_of(THUMBNAIL_CLEANER_BATCH_FILE_NUM) {
            thread::sleep(Duration::from_millis(THUMBNAIL_CLEANER_BATCH_SLEEP_MS));
        }
    }

    log::info!(
        "spawn_thumbnail_cleanup_worker: end. removed files = {}, checked files = {}, total (file + dir) = {}",
        removed,
        total_file,
        total
    );
    Ok(())
}
