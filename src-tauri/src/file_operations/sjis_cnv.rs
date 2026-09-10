use encoding_rs::SHIFT_JIS;
use std::{
    char,
    sync::{LazyLock, Mutex},
};

const PAGE_COUNT: usize = 0x110000 / 0x100; // UTF32のうち使われている範囲を256づつにページ分割する
const UNINITIALIZED: u16 = 0xFFFF; // キャッシュされていない
const NOT_SJIS: u16 = 0xFFFE; // キャッシュ済み (SJISでない)

/// Unicode char -> Shift_JIS の変換キャッシュ
/// ※ Unicode は 0x0 - 0x10FFFF の範囲
///
/// キャッシュのデータ構造
///   pages
///     ├─ 0x00 → None
///     ├─ 0x01 → None
///     ├─ ...
///     ├─ 0x30 → [256個のu16]
///     ├─ 0x31 → None
///     ├─ ...
///
/// アルゴリズム
///   get(c: char)
///     ├─ U+0000..U+007F (ASCII)
///     │    c => u16 に変換
///     └─ U+0080..U+10FFFF
///          page_index = c >> 8 (上位16ビット)
///          char_index = c & 0xFF (下位8ビット)
///          pages[page_index][char_index]
///              未計算なら、c => SJIS変換 => u16変換 してキャッシュに保存
///
pub struct SjisCache {
    pages: Vec<Option<Box<[u16; 256]>>>,
}

impl SjisCache {
    pub fn new() -> Self {
        Self {
            pages: vec![None; PAGE_COUNT],
        }
    }

    /// Unicode char を Shift_JIS の u16 に変換する。
    ///
    /// None: Shift_JIS に変換できない
    /// Some: Shift_JIS の1～2バイトを u16 に格納
    #[inline]
    pub fn get(&mut self, c: char) -> Option<u16> {
        let cp = c as u32;

        // ASCIIはSJISと同じ値なので直接返す
        if cp <= 0x7F {
            return Some(cp as u16);
        }

        let page_index = (cp >> 8) as usize;
        let char_index = (cp & 0xFF) as usize;

        // このUnicodeページがまだ存在しなければ生成
        let page = self.pages[page_index].get_or_insert_with(|| Box::new([UNINITIALIZED; 256]));

        let value = page[char_index];

        if value != UNINITIALIZED {
            return if value == NOT_SJIS { None } else { Some(value) };
        }

        // UTF-8への変換
        let mut utf8 = [0u8; 4];
        let s = c.encode_utf8(&mut utf8);

        // Shift_JISへ変換
        let (encoded, _, had_errors) = SHIFT_JIS.encode(s);

        let value = if had_errors {
            NOT_SJIS
        } else {
            match encoded.as_ref() {
                [a] => *a as u16,
                [a, b] => ((*a as u16) << 8) | (*b as u16),
                _ => NOT_SJIS, // ここにはこないはず
            }
        };

        page[char_index] = value;

        if value == NOT_SJIS {
            None
        } else {
            Some(value)
        }
    }
}

pub static SJIS_CACHE: LazyLock<Mutex<SjisCache>> = LazyLock::new(|| Mutex::new(SjisCache::new()));

// =============================================================================================
//
// #####################   #####################      ###############      #####################
// #####################   #####################      ###############      #####################
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###                              ###
//          ###            ###                     ###                              ###
//          ###            ###############            ###############               ###
//          ###            ###############            ###############               ###
//          ###            ###                                       ###            ###
//          ###            ###                                       ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            #####################      ###############               ###
//          ###            #####################      ###############               ###
//
// =============================================================================================

#[cfg(test)]
mod tests {

    use super::*;

    fn cmp(c: char, sjis: Option<u16>) {
        let ret = SJIS_CACHE.lock().unwrap().get(c);
        assert_eq!(ret, sjis);
    }

    #[test]
    fn test_sjis_cache() {
        cmp('0', Some(0x30));
        cmp(' ', Some(0x20));
        cmp('@', Some(0x40));
        cmp('ｱ', Some(0xB1));

        cmp('☆', Some(0x8199));
        cmp('あ', Some(0x82A0));
        cmp('１', Some(0x8250));
        cmp('ア', Some(0x8341));
        cmp('亜', Some(0x889F));
        cmp('熙', Some(0xEAA4));

        cmp('①', Some(0x8740));
        cmp('㌔', Some(0x8760));
        cmp('㍻', Some(0x877E));

        cmp('©', None);
        cmp('Ä', None);
        cmp('♨', None);
        cmp('갠', None);
    }
}
