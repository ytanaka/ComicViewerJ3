//! ユーザーが入力したローマ字がファイル名に一致するかどうか判定するためのクラス
//!
//! 起動時にワーカースレッドを起動する (ディレクトリ内のファイル名一覧を形態素解析してキャッシュしておく)

use dashmap::DashMap;
use rayon::prelude::*;
use regex::Regex;
use std::{
    ffi::{OsStr, OsString},
    sync::{mpsc, Arc},
    thread,
};

use crate::{
    state::{
        app_state::AppState,
        tab_info::{TabGeneration, TabInfo},
    },
    text_search::{reverse_migemo::ReverseMigemo, vibrato::Vibrato, vibrato_data::SplStr},
    types::TabId,
};

//----------------------------------------------------------------------------------------------------------------------

/// ワーカースレッドに投げるタスク
struct WorkerPacket {
    tab_id: TabId,
    generation: TabGeneration,

    list: Vec<Arc<OsStr>>,

    progress: usize,
    total: usize,
}
impl WorkerPacket {
    fn create(tab: &TabInfo, list: Vec<Arc<OsStr>>) -> Vec<Self> {
        let list2: Vec<_> = list.chunks(1000).map(|c| c.to_vec()).collect();
        let mut progress = 0;
        list2
            .iter()
            .map(|v| {
                progress += v.len();
                WorkerPacket {
                    tab_id: tab.get_id(),
                    generation: tab.get_generation(),
                    list: v.to_vec(),
                    progress,
                    total: list.len(),
                }
            })
            .collect()
    }

    /// タブが存在して、ディレクトリが変わっていないことを確認
    /// 変わっていたら、タスクをキャンセルする (ソート状態が変わっただけならOK)
    fn check_tab(&self, state: &AppState) -> bool {
        match state.get_tab(self.tab_id) {
            Err(_) => false,
            Ok(tab) => tab.read().unwrap().check_generation(self.generation),
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------

pub struct TextMatcher {
    tx: mpsc::Sender<WorkerPacket>,

    yomi_cache: Arc<DashMap<OsString, Arc<SplStr>>>,

    vibrato: Arc<Vibrato>,
    reverse_migemo: Arc<ReverseMigemo>,
}

impl TextMatcher {
    pub fn new(state: Arc<AppState>) -> Arc<Self> {
        let (tx, rx) = mpsc::channel::<WorkerPacket>();

        let ret = Arc::new(TextMatcher {
            tx,
            yomi_cache: Arc::new(DashMap::new()),
            reverse_migemo: state.reverse_migemo.clone(),
            vibrato: state.vibrato.clone(),
        });
        let ret2 = ret.clone();

        // ワーカースレッド起動
        thread::spawn(move || loop {
            let packet = rx.recv().unwrap();
            let comment = format!("TextMatcher worker(tab_id:{}): ", packet.tab_id);

            let canceled = !packet.check_tab(&state); // タブロックして状態変化を見る
            let done = if canceled {
                0
            } else {
                packet
                    .list
                    .par_iter()
                    .map(|s| ret.put_cache(s).0)
                    .filter(|x| *x)
                    .count()
            };

            if done != 0 {
                log::debug!(
                    "{comment}tokenized({}) {}/{}",
                    done,
                    packet.progress,
                    packet.total
                );
            }

            let canceled = !packet.check_tab(&state); // タブロックして状態変化を見る
            let finish_msg = if canceled { "[CANCELED]" } else { "finish" };
            if packet.progress == packet.total {
                log::debug!("{comment}tokenized total={} {}", packet.total, finish_msg);
            }
        });
        ret2
    }

    pub fn send_to_worker(&self, tab: &TabInfo, list: Vec<Arc<OsStr>>) {
        for list in WorkerPacket::create(tab, list) {
            self.tx.send(list).unwrap();
        }
    }

    pub fn has_cache(&self, s: &OsStr) -> bool {
        self.yomi_cache.get(s).is_some()
    }

    fn get_cache(&self, s: &OsStr) -> Arc<SplStr> {
        let ret = self.put_cache(s);
        ret.1
    }
    // キャッシュから解析結果を取得する (まだ解析していないなら解析する)
    // まだキャッシュに存在しなかったら true を返す
    fn put_cache(&self, s: &OsStr) -> (bool, Arc<SplStr>) {
        match self.yomi_cache.get(s) {
            Some(kv) => (false, kv.value().clone()),
            None => {
                let tok = Arc::new(
                    self.vibrato
                        .tokenize(&s.to_string_lossy(), self.reverse_migemo.clone()),
                );
                self.yomi_cache.insert(s.to_os_string(), tok.clone());
                (true, tok)
            }
        }
    }

    // ファイル名が入力に一致するかどうか判定する
    // ファイル名の一致個所を返す (String中の 開始インデックス, 終了インデックス)
    pub fn find(
        &self,
        input_katakana: &str,    // 入力されたローマ字 -> カタカナ
        input_migemo_re: &Regex, // 入力されたローマ字のMigemo正規表現
        input_normalized: &str, // 入力されたローマ字や漢字など -> 正規化 (正規化したファイル名と単純一致させる)
        filename: &OsStr,       // 比較するファイル名
    ) -> Option<(usize, usize)> {
        // Migemo で検索
        if let Some(m) = input_migemo_re
            .captures_iter(&filename.to_string_lossy())
            .next()
        {
            let m = m.get_match();
            return Some((m.start(), m.end()));
        }

        // Vibrato で検索
        let vstr = self.get_cache(filename);
        if let Some(m) = vstr.find(input_katakana) {
            return Some(vstr.elmidx_to_stridx(m));
        }

        // 正規化した文字列に対して単純検索 (アルファベットや数字に一致するかも)
        if vstr.get_normalized_str().find(input_normalized).is_some() {
            // 正規化する前後で文字列長が変わることがあるので、元の文字列のどこに一致したかはわからなくなる
            return Some((0, vstr.get_org_str().len()));
        }

        None
    }
}
