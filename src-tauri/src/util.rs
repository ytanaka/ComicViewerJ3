//! 共通関数など

use std::{fmt::Display, path::Path};

/// Rustコマンドの結果をログに出力する
#[macro_export]
#[allow(unused_macros)]
macro_rules! LOG_RESULT {
    ($msg:expr, $block:block) => {{
        let msg2 = $msg; // ここで代入しないと、$msg に format!("{}", String) を渡せない
        let result = { $block };
        match &result {
            Ok(_) => log::trace!("commands::{}: Ok", msg2),
            Err(e) => log::trace!("commands::{}: Err({})", msg2, e),
        }
        result
    }};
}

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
