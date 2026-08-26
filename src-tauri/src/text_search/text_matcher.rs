use dashmap::DashMap;
use rayon::prelude::*;
use regex::Regex;
use std::{
    sync::{mpsc, Arc},
    thread,
};

use crate::{
    state::app_state::AppState,
    text_search::{
        migemo::Migemo, reverse_migemo::ReverseMigemo, romaji_cnv::RomajiCnv, vibrato::Vibrato,
        vibrato_data::SplStr,
    },
};

pub struct TextMatcher {
    tx: mpsc::Sender<Vec<String>>,

    yomi_cache: Arc<DashMap<String, Arc<SplStr>>>,

    vibrato: Arc<Vibrato>,
    reverse_migemo: Arc<ReverseMigemo>,
    migemo: Arc<Migemo>,
    romaji_cnv: Arc<RomajiCnv>,
}

impl TextMatcher {
    pub fn new(state: &AppState) -> Arc<Self> {
        let (tx, rx) = mpsc::channel::<Vec<String>>();

        let ret = Arc::new(TextMatcher {
            tx,
            yomi_cache: Arc::new(DashMap::new()),
            reverse_migemo: state.reverse_migemo.get().unwrap().clone(),
            vibrato: state.vibrato.get().unwrap().clone(),
            migemo: state.migemo.get().unwrap().clone(),
            romaji_cnv: state.romaji_cnv.clone(),
        });
        let ret2 = ret.clone();

        thread::spawn(move || loop {
            let list = rx.recv().unwrap();
            list.par_iter().for_each(|s| {
                ret.get_cache(s);
            });
            log::debug!("TextMatcher worker: tokenized {} strings", list.len());
        });
        ret2
    }

    pub fn send_to_worker(&self, list: Vec<String>) {
        self.tx.send(list).unwrap();
    }

    fn get_cache(&self, s: &str) -> Arc<SplStr> {
        match self.yomi_cache.get(s) {
            Some(kv) => kv.value().clone(),
            None => {
                let tok = Arc::new(self.vibrato.tokenize(&s, self.reverse_migemo.clone()));
                self.yomi_cache.insert(s.to_string(), tok.clone());
                tok
            }
        }
    }

    pub fn find(
        &self,
        input_katakana: &str,
        input_migemo_re: &Regex,
        input_normalized: &str,
        target: &str,
    ) -> Option<(usize, usize)> {
        // Migemo で検索
        if let Some(m) = input_migemo_re.captures_iter(target).next() {
            let m = m.get_match();
            return Some((m.start(), m.end()));
        }

        // Vibrato で検索
        let vstr = self.get_cache(target);
        if let Some(m) = vstr.find(input_katakana) {
            return Some(vstr.elmidx_to_stridx(m));
        }

        // 正規化した文字列に対して単純検索 (アルファベットや数字に一致するかも)
        if let Some(n) = vstr.get_normalized_str().find(input_normalized) {
            return Some((0, vstr.get_org_str().len()));
        }

        None
    }
}
