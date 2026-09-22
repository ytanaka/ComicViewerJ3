//! キャッシュファイルを定期的に削除するバックグラウンドワーカースレッド

use std::{fs, path::PathBuf, sync::Arc, thread, time::Duration};

use walkdir::WalkDir;

use crate::{
    commands::images_util::{get_resized_img_dir, get_thumbnail_dir},
    state::app_state::AppState,
};

// ---------------------------------------------------------------------------------------------------------------------
pub struct CacheCleanupParam {
    pub comment: String,
    pub verbose_log: bool,

    pub execute_interval_sec: u64,
    pub batch_file_num: u64,
    pub batch_sleep_ms: u64,

    pub target_dir: PathBuf,
    pub expire_sec: u64,
}

pub fn start_cache_cleanup_worker(param: CacheCleanupParam) {
    thread::spawn(move || loop {
        if let Err(e) = exec(&param) {
            log::error!("spawn_Cache_cleanup_worker: error {}", e);
        }
        thread::sleep(Duration::from_hours(param.execute_interval_sec));
    });
}

fn exec(param: &CacheCleanupParam) -> anyhow::Result<()> {
    if param.verbose_log {
        log::info!("spawn_Cache_cleanup_worker: start");
    }

    let mut total_file: u64 = 0;
    let mut total: u64 = 0;
    let mut removed: u64 = 0;

    for walk in WalkDir::new(&param.target_dir) {
        let f = walk?;
        let meta = f.metadata()?;
        if meta.is_file() {
            let elapsed_sec = meta.modified()?.elapsed()?.as_secs();
            if param.expire_sec < elapsed_sec {
                fs::remove_file(f.path())?;
                removed += 1;
                log::trace!(
                    "cache_cleanup_worker({}): remove file {:?}",
                    param.comment,
                    f.path()
                );
            }
            total_file += 1;
        };
        total += 1;
        if total.is_multiple_of(param.batch_file_num) {
            thread::sleep(Duration::from_millis(param.batch_sleep_ms));
        }
    }

    if param.verbose_log {
        log::info!(
            "cache_cleanup_worker({}): end. removed files = {}, checked files = {}, total (file + dir) = {}",
            param.comment,
            removed,
            total_file,
            total
        );
    }

    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------

// サムネイル
fn start_thumbnail_cleanup_worker(
    app: Arc<tauri::AppHandle>,
    state: Arc<AppState>,
) -> anyhow::Result<()> {
    let param = CacheCleanupParam {
        comment: "thumbnail".to_string(),
        verbose_log: true,

        execute_interval_sec: 30 * 60,
        batch_file_num: 100,
        batch_sleep_ms: 100,

        target_dir: get_thumbnail_dir(&app)?,
        expire_sec: state.preferences.read().unwrap().thumbnail_expiration_days as u64 * 24 * 3600,
    };
    start_cache_cleanup_worker(param);
    Ok(())
}

// サイズ変換された画像
fn start_resized_image_cleanup_worker(
    app: Arc<tauri::AppHandle>,
    state: Arc<AppState>,
) -> anyhow::Result<()> {
    let param = CacheCleanupParam {
        comment: "resized_image".to_string(),
        verbose_log: false,

        execute_interval_sec: 60,
        batch_file_num: 100,
        batch_sleep_ms: 100,

        target_dir: get_resized_img_dir(&app)?,
        expire_sec: state.preferences.read().unwrap().thumbnail_expiration_days as u64 * 24 * 3600,
    };
    start_cache_cleanup_worker(param);
    Ok(())
}

pub struct CacheCleanupWorker {}

impl CacheCleanupWorker {
    pub fn new(app: Arc<tauri::AppHandle>, state: Arc<AppState>) -> Arc<Self> {
        if let Err(e) = start_thumbnail_cleanup_worker(app.clone(), state.clone()) {
            log::error!("start_thumbnail_cleanup_worker: error={}", e.to_string())
        }
        if let Err(e) = start_resized_image_cleanup_worker(app.clone(), state.clone()) {
            log::error!("start_thumbnail_cleanup_worker: error={}", e.to_string())
        }
        Arc::new(CacheCleanupWorker {})
    }
}
