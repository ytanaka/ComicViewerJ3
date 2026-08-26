use kanaria::{string::UCSStr, utils::ConvertTarget};
use unicode_normalization::UnicodeNormalization;
use wana_kana::utils::is_char_katakana;

pub fn is_ascii(s: &str) -> bool {
    s.chars().all(|c| c.is_ascii())
}

pub fn is_katakana(s: &str) -> bool {
    s.chars().find(|c| !is_char_katakana(*c)).is_none()
}

pub fn is_kanji_char(c: char) -> bool {
    matches!(
        c as u32,
        0x4E00..=0x9FFF   // CJK Unified Ideographs
        | 0x3400..=0x4DBF // CJK Unified Ideographs Extension A
        | 0xF900..=0xFAFF // CJK Compatibility Ideographs
        | 0x20000..=0x2A6DF // Extension B
        | 0x2A700..=0x2B73F // Extension C
        | 0x2B740..=0x2B81F // Extension D
        | 0x2B820..=0x2CEAF // Extension E/F
        | 0x2CEB0..=0x2EBEF // Extension G/H
        | 0x30000..=0x323AF // Extension I
    )
}

pub fn normalize_str(s: &str) -> String {
    let s = s.nfkc().collect::<String>();
    let s = UCSStr::from_str(&s)
        .narrow(ConvertTarget::ALPHABET | ConvertTarget::NUMBER | ConvertTarget::SYMBOL)
        .wide(ConvertTarget::KATAKANA)
        .lower_case()
        .katakana()
        .to_string();
    s.chars()
        .map(|c| normalize_dash(c))
        .map(|c| normalize_quote(c))
        .map(|c| normalize_back_quote(c))
        .map(|c| normalize_double_quote(c))
        .map(|c| normalize_misc(c))
        .collect()
}
fn normalize_dash(c: char) -> char {
    match c {
        '－'  // 全角ハイフンマイナス 
        | 'ｰ' // Halfwidth Katakana-Hiragana Prolonged Sound Mark
        | '‐' // Hyphen
        | '‒' // Figure Dash
        | '–' // En Dash
        | '—' // Em Dash
        | '―' // Horizontal Bar
        | '−' // 数学のマイナス記号
        => '-',

        _ => c,
    }
}
fn normalize_quote(c: char) -> char {
    match c {
        '＇' // Fullwidth Apostrophe
        | '’' // Right Single Quotation Mark
        | '‘' // Left Single Quotation Mark
        | 'ʼ' // Modifier Letter Apostrophe
        | '‛' // Single High-Reversed-9 Quotation Mark
        | '′' // Prime（分・フィートなど）
        | '´' // Acute Accent
        => '\'',

        _ => c,
    }
}
fn normalize_back_quote(c: char) -> char {
    match c {
        | '｀' // Fullwidth Grave Accent
        => '`',

        _ => c,
    }
}
fn normalize_double_quote(c: char) -> char {
    match c {
        '＂'   // Fullwidth Quotation Mark
        | '“'  // Left Double Quotation Mark
        | '”'  // Right Double Quotation Mark
        | '„'  // Double Low-9 Quotation Mark
        | '‟'  // Double High-Reversed-9 Quotation Mark
        | '″'  // Double Prime
        | '〝' // Reversed Double Prime Quotation Mark
        | '〞' // Double Prime Quotation Mark
        | '〟' // Low Double Prime Quotation Mark
        => '"',

        _ => c,
    }
}
fn normalize_misc(c: char) -> char {
    match c {
        '×' => 'x',

        _ => c,
    }
}

// 単体テスト時だけログ出力する
#[macro_export]
#[allow(unused_macros)]
#[cfg(test)]
macro_rules! UT_LOG {
    ($($arg:tt)*) => {
        println!($($arg)*);
    };
}
#[macro_export]
#[allow(unused_macros)]
#[cfg(not(test))]
macro_rules! UT_LOG {
    ($($arg:tt)*) => {
        // 本番では何もしない
    };
}

// =================================================================================================
// =================================================================================================
// =================================================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_str() {
        let n = |s| normalize_str(s);
        assert_eq!(n("abc"), "abc");
        assert_eq!(n("ａｂｃ　ＡＢＣ"), "abc abc");
        assert_eq!(n("半角ｶﾀｶﾅｶﾞぜんかくに"), "半角カタカナガゼンカクニ");
        assert_eq!(n("～！＠＃＄％＾＆＊（）＿＋"), "~!@#$%^&*()_+");
        assert_eq!(n("＝｛｝［］：；＜＞？，．／"), "={}[]:;<>?,./");
        assert_eq!(n("ノーマル～"), "ノ-マル~");
        assert_eq!(n("０１２３４５６７８９"), "0123456789");
        assert_eq!(n("H×H"), "hxh");
    }
}
