//! 共通関数など

use std::{
    fmt::Display,
    path::Path,
    sync::atomic::{AtomicBool, AtomicU64},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

// ---------------------------------------------------------------------------------------------------------------------

/// デバッグ用の詳細ログ
pub static WRITE_LOG_VERBOSE: AtomicBool = AtomicBool::new(false);
pub fn is_write_log_verbose() -> bool {
    crate::util::WRITE_LOG_VERBOSE.load(std::sync::atomic::Ordering::Relaxed)
}
#[macro_export]
#[allow(unused_macros)]
macro_rules! LOG_VERBOSE {
    ($($arg:tt)*) => {
        if $crate::util::is_write_log_verbose() {
            let s = format!($($arg)*);
            log::trace!("... {}", s);
        }
    };
}

// ---------------------------------------------------------------------------------------------------------------------

/// Rustコマンドの結果をログに出力する
#[macro_export]
#[allow(unused_macros)]
macro_rules! LOG_RESULT {
    ($msg:expr, $block:block) => {{
        let t0 = std::time::Instant::now();

        if $crate::util::is_write_log_verbose() {
            log::trace!("start commands::{}", $msg);
        }

        let msg2 = $msg; // ここで代入しないと、$msg に format!("{}", String) を渡せない
        let result = { $block };
        match &result {
            Ok(_) => log::trace!("end   commands::{}: Ok, {}ms", msg2, t0.elapsed().as_millis()),
            Err(e) => log::trace!("end   commands::{}: Err({})", msg2, e),
        }
        result
    }};
}

// ---------------------------------------------------------------------------------------------------------------------

/// 単体テスト時だけログ出力する
#[macro_export]
#[allow(unused_macros)]
#[cfg(test)]
macro_rules! UT_LOG {
    ($($arg:tt)*) => {
        println!($($arg)*);
    };
}
/// 単体テスト時だけログ出力する
#[macro_export]
#[allow(unused_macros)]
#[cfg(not(test))]
macro_rules! UT_LOG {
    ($($arg:tt)*) => {
        // 本番では何もしない
    };
}

// ---------------------------------------------------------------------------------------------------------------------

pub trait ErrorExt {
    fn to_full_string(&self) -> String;
}
impl<T: std::error::Error + ?Sized> ErrorExt for T {
    fn to_full_string(&self) -> String {
        let mut s = self.to_string();
        let mut tmp = self.source();
        while let Some(x) = tmp {
            s.push_str(": ");
            s.push_str(&x.to_string());
            tmp = x.source()
        }
        s
    }
}

// ---------------------------------------------------------------------------------------------------------------------

const MAX_VEC_STR: usize = 50;

fn vec_to_str_generic<T, F>(v: &[T], cnv: F) -> String
where
    F: Fn(&T) -> String,
{
    let mut ret = String::new();
    for s in v.iter().map(cnv) {
        if !ret.is_empty() {
            ret.push(',');
        }
        ret.push_str(&s);
        if MAX_VEC_STR < ret.len() {
            break;
        }
    }
    if MAX_VEC_STR <= ret.len() {
        ret = ret.chars().take(MAX_VEC_STR).collect();
        ret.push_str("...");
    }
    format!("vec[{}: {}]", v.len(), ret)
}
pub fn vec_to_str<T: Display>(v: &[T]) -> String {
    vec_to_str_generic(v, |s| ToString::to_string(s))
}
pub fn pathvec_to_str<P: AsRef<Path>>(v: &[P]) -> String {
    vec_to_str_generic(v, |s| s.as_ref().to_string_lossy().to_string())
}

pub fn parse_bool(s: &str) -> Option<bool> {
    match s {
        "true" => Some(true),
        "false" => Some(false),
        _ => None,
    }
}

// ---------------------------------------------------------------------------------------------------------------------

/// IO処理で忙しいかどうかの判定をする
/// フォアグラウンドでIO処理をしているとき、バックグラウンドのIO処理を待たせるための仕組み

/// フォアグラウンドでIO処理をした最後の時間
static IO_BUSY_TIME: AtomicU64 = AtomicU64::new(0);

/// この時間IO処理がないなら余裕があるとみなす
const IO_BUSY_THRESHOLD_MS: u64 = 50;

fn now_time() -> u64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Err(e) => {
            log::error!("BUG: system time error: {}", e);
            0
        }
        Ok(t) => t.as_millis() as u64,
    }
}

/// フォあるグラウンドでIO処理をするときに呼ぶ
pub fn set_io_busy() {
    IO_BUSY_TIME.store(now_time(), std::sync::atomic::Ordering::Relaxed);
}

fn is_io_busy() -> bool {
    let t = IO_BUSY_TIME.load(std::sync::atomic::Ordering::Relaxed);
    let now = now_time();
    let elapsed = now - t;
    elapsed < IO_BUSY_THRESHOLD_MS
}

/// バックグラウンドでIO処理をするとき、フォアグラウンドの処理を邪魔したくないときに呼ぶ
pub fn await_io_idle(comment: &str) {
    for cnt in 0..30 {
        if !is_io_busy() {
            return;
        }
        LOG_VERBOSE!("SLEEP for IO idle ... [{}]({})", comment, cnt);
        std::thread::sleep(Duration::from_millis(IO_BUSY_THRESHOLD_MS / 2));
    }
}
