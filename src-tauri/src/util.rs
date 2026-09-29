//! 共通関数など

/// Rustコマンドの結果をログに出力する
#[macro_export]
#[allow(unused_macros)]
macro_rules! LOG_RESULT {
    ($msg:expr, $block:block) => {{
        let msg2 = $msg; // ここで代入しないと、$msg に format!("{}", String) を渡せない
        let result = { $block };
        match &result {
            Ok(_) => log::trace!("{}: Ok", msg2),
            Err(e) => log::trace!("{}: Err({})", msg2, e),
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
