use std::time::{SystemTime, UNIX_EPOCH};

pub fn to_unix_time(t: Result<SystemTime, std::io::Error>) -> Option<u64> {
    t.ok().and_then(|t| {
        let t = t.duration_since(UNIX_EPOCH);
        t.ok().map(|t| t.as_secs())
    })
}

pub fn try_u64(s: &str) -> Result<u64, &str> {
    s.parse().map_err(|_| "invalid number")
}
