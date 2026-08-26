use dashmap::DashMap;
use rayon::prelude::*;
use std::{
    rc::Rc,
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
    pub fn new(state: &AppState) -> Self {
        let (tx, rx) = mpsc::channel::<Vec<String>>();
        let vibrato = state.vibrato.get().unwrap().clone();
        let reverse_migemo = state.reverse_migemo.get().unwrap().clone();
        let yomi_cache = Arc::new(DashMap::new());
        let yomi_cache2 = yomi_cache.clone();

        thread::spawn(move || loop {
            rx.recv().unwrap().par_iter().for_each(|s| {
                let _ = TextMatcher::get_cache_impl(s, &yomi_cache, &vibrato, &reverse_migemo);
            });
        });
        TextMatcher {
            tx,
            yomi_cache: yomi_cache2,
            reverse_migemo: state.reverse_migemo.get().unwrap().clone(),
            vibrato: state.vibrato.get().unwrap().clone(),
            migemo: state.migemo.get().unwrap().clone(),
            romaji_cnv: state.romaji_cnv.clone(),
        }
    }

    pub fn send_to_worker(&self, romaji_list: Vec<String>) {
        self.tx.send(romaji_list).unwrap();
    }

    fn get_cache_impl(
        s: &str,
        yomi_cache: &Arc<DashMap<String, Arc<SplStr>>>,
        vibrato: &Arc<Vibrato>,
        reverse_migemo: &Arc<ReverseMigemo>,
    ) -> Arc<SplStr> {
        match yomi_cache.get(s) {
            Some(kv) => kv.value().clone(),
            None => {
                let tok = Arc::new(vibrato.tokenize(&s, reverse_migemo.clone()));
                yomi_cache.insert(s.to_string(), tok.clone());
                tok
            }
        }
    }

    pub fn get_cache(&self, s: &str) -> Arc<SplStr> {
        Self::get_cache_impl(s, &self.yomi_cache, &self.vibrato, &self.reverse_migemo)
    }

    pub fn find(&self, romaji: &str, target: &str) {
        let migemo_re = self.migemo.get_query_regex(romaji);
        let katakana = self.romaji_cnv.cnv(romaji);
        let x = self.get_cache(target);
        
        ()
    }
}
