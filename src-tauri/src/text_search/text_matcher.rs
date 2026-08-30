use dashmap::DashMap;
use rayon::prelude::*;
use regex::Regex;
use std::{
    path::{Path, PathBuf},
    sync::{mpsc, Arc},
    thread,
};

use crate::{
    state::app_state::AppState,
    text_search::{reverse_migemo::ReverseMigemo, vibrato::Vibrato, vibrato_data::SplStr},
    types::TabId,
};

struct WorkerPacket {
    tab_id: TabId,
    path: PathBuf,
    list: Vec<String>,

    progress: usize,
    total: usize,
}
impl WorkerPacket {
    fn create(tab_id: TabId, path: impl AsRef<Path>, list: Vec<String>) -> Vec<Self> {
        let list2: Vec<Vec<String>> = list.chunks(1000).map(|c| c.to_vec()).collect();
        let mut progress = 0;
        list2
            .iter()
            .map(|v| {
                progress += v.len();
                WorkerPacket {
                    tab_id,
                    path: path.as_ref().to_path_buf(),
                    list: v.to_vec(),
                    progress,
                    total: list.len(),
                }
            })
            .collect()
    }

    fn check_tab(&self, state: &AppState) -> bool {
        // タブが存在して、ディレクトリが変わっていないことを確認
        match state.get_tab(self.tab_id) {
            Err(_) => false,
            Ok(tab) => tab.read().unwrap().get_current_dir() == Some(&self.path),
        }
    }
}

pub struct TextMatcher {
    tx: mpsc::Sender<WorkerPacket>,

    yomi_cache: Arc<DashMap<String, Arc<SplStr>>>,

    vibrato: Arc<Vibrato>,
    reverse_migemo: Arc<ReverseMigemo>,
}

impl TextMatcher {
    pub fn new(state: Arc<AppState>) -> Arc<Self> {
        let (tx, rx) = mpsc::channel::<WorkerPacket>();

        let ret = Arc::new(TextMatcher {
            tx,
            yomi_cache: Arc::new(DashMap::new()),
            reverse_migemo: state.reverse_migemo.get().unwrap().clone(),
            vibrato: state.vibrato.get().unwrap().clone(),
        });
        let ret2 = ret.clone();

        thread::spawn(move || loop {
            let packet = rx.recv().unwrap();
            let comment = format!("TextMatcher worker(tab_id:{}): ", packet.tab_id);
            if !packet.check_tab(&state) {
                log::debug!("{comment}: cancel , path:{}", packet.path.display(),);
            } else {
                let done = packet
                    .list
                    .par_iter()
                    .map(|s| ret.put_cache(s).0)
                    .filter(|x| *x)
                    .count();
                log::debug!(
                    "{comment}: tokenized({}) {}/{}",
                    done,
                    packet.progress,
                    packet.total,
                );
            }
        });
        ret2
    }

    pub fn send_to_worker(&self, tab_id: TabId, path: impl AsRef<Path>, list: Vec<String>) {
        for list in WorkerPacket::create(tab_id, path, list) {
            self.tx.send(list).unwrap();
        }
    }

    pub fn has_cache(&self, s: &str) -> bool {
        self.yomi_cache.get(s).is_some()
    }

    fn get_cache(&self, s: &str) -> Arc<SplStr> {
        let ret = self.put_cache(s);
        ret.1
    }
    // キャッシュから解析結果を取得する (まだ解析していないなら解析する)
    // まだキャッシュに存在しなかったら true を返す
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
