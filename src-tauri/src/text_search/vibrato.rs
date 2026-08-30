use std::{io::Cursor, sync::Arc};

use vibrato::{Dictionary, Tokenizer};
use zstd::Decoder;

use crate::text_search::{
    reverse_migemo::ReverseMigemo,
    util::{is_ascii, is_kanji_char, normalize_str},
    vibrato_data::{SplStr, SplStrElm},
};

const UNIDIC_YOMI_COLUMN: usize = 20;

pub struct Vibrato {
    tokenizer: Tokenizer,
}

impl Vibrato {
    pub fn new() -> Self {
        // 辞書を読み込み
        let dict_data =
            include_bytes!("../../dict/unidic-cwj-3_1_1+compact/system.dic.zst").to_vec();
        let reader = Decoder::new(Cursor::new(dict_data)).unwrap();
        let dict = Dictionary::read(reader).unwrap();

        // トークナイザー生成
        let tokenizer = Tokenizer::new(dict);

        Vibrato { tokenizer }
    }

    pub fn tokenize(&self, s: &str, reverse_migemo: Arc<ReverseMigemo>) -> SplStr {
        // 正規化してASCIIだけなら形態素解析しない
        let norm_s = normalize_str(s);
        if is_ascii(&norm_s) {
            return SplStr::new(&norm_s, Vec::new(), reverse_migemo);
        }

        let mut worker = self.tokenizer.new_worker();
        worker.reset_sentence(&s);
        worker.tokenize();

        let mut ret: Vec<_> = Vec::new();
        for t in worker.token_iter() {
            let line = csv::ReaderBuilder::new()
                .has_headers(false)
                .from_reader(t.feature().as_bytes())
                .records()
                .next()
                .unwrap()
                .unwrap();

            let yomi = line
                .get(UNIDIC_YOMI_COLUMN)
                .filter(|_| !is_ascii(t.surface())) // 元の文字列がASCIIのみの場合は読みを無視する
                .filter(|s| *s != "*") // 読みがない場合は "*" になっている
                .unwrap_or_else(|| t.surface()); // 読みがない場合は元の文字列を採用 (英単語とか)

            if yomi.chars().find(|c| is_kanji_char(*c)).is_some() && yomi == t.surface() {
                // 読みが漢字のままの場合がある
                // その場合は1文字づつに分解して Migemo 辞書で読みを取得することを期待する
                for c in t.surface().chars() {
                    ret.push(SplStrElm::new(&c.to_string(), &c.to_string()))
                }
            } else {
                ret.push(SplStrElm::new(t.surface(), yomi))
            }
        }

        SplStr::new(&norm_s, ret, reverse_migemo)
    }
}
