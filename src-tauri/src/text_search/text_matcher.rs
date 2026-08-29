use dashmap::DashMap;
use rayon::prelude::*;
use regex::Regex;
use std::{
    sync::{mpsc, Arc},
    thread,
};

use crate::{
    state::app_state::AppState,
    text_search::{reverse_migemo::ReverseMigemo, vibrato::Vibrato, vibrato_data::SplStr},
};

pub struct TextMatcher {
    tx: mpsc::Sender<Vec<String>>,

    yomi_cache: Arc<DashMap<String, Arc<SplStr>>>,

    vibrato: Arc<Vibrato>,
    reverse_migemo: Arc<ReverseMigemo>,
}

impl TextMatcher {
    pub fn new(state: &AppState) -> Arc<Self> {
        let (tx, rx) = mpsc::channel::<Vec<String>>();

        let ret = Arc::new(TextMatcher {
            tx,
            yomi_cache: Arc::new(DashMap::new()),
            reverse_migemo: state.reverse_migemo.get().unwrap().clone(),
            vibrato: state.vibrato.get().unwrap().clone(),
        });
        let ret2 = ret.clone();

        thread::spawn(move || loop {
            let list = rx.recv().unwrap();
            let n = list
                .par_iter()
                .map(|s| ret.put_cache(s).0)
                .filter(|x| *x)
                .count();
            log::debug!("TextMatcher worker: tokenized {}/{} strings", n, list.len());
        });
        ret2
    }

    pub fn send_to_worker(&self, list: Vec<String>) {
        self.tx.send(list).unwrap();
    }

    pub fn has_cache(&self, s: &str) -> bool {
        self.yomi_cache.get(s).is_some()
    }

    fn get_cache(&self, s: &str) -> Arc<SplStr> {
        let ret = self.put_cache(s);
        ret.1
    }
    // まだキャッシュに存在しなかったら true
    fn put_cache(&self, s: &str) -> (bool, Arc<SplStr>) {
        match self.yomi_cache.get(s) {
            Some(kv) => (false, kv.value().clone()),
            None => {
                let tok = Arc::new(self.vibrato.tokenize(&s, self.reverse_migemo.clone()));
                self.yomi_cache.insert(s.to_string(), tok.clone());
                (true, tok)
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
        if let Some(_) = vstr.get_normalized_str().find(input_normalized) {
            return Some((0, vstr.get_org_str().len()));
        }

        None
    }
}
