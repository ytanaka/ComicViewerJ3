use std::time::{SystemTime, UNIX_EPOCH};

pub fn to_unix_time(t: Result<SystemTime, std::io::Error>) -> Option<u64> {
    t.ok().and_then(|t| {
        let t = t.duration_since(UNIX_EPOCH);
        t.ok().map(|t| t.as_secs())
    })
}

#[macro_export]
#[allow(unused_macros)]
macro_rules! LOG_RESULT {
    ($msg:expr, $block:block) => {{
        let msg2 = $msg; // ここで代入しないと、$msg に format!("{}", String) を渡せない
        let result = (|| $block)();
        match &result {
            Ok(_) => log::trace!("{}: Ok", msg2),
            Err(e) => log::trace!("{}: Err({})", msg2, e),
        }
        result
    }};
}
