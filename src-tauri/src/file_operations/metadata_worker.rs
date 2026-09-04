//! ファイルメタデータをバックグラウンドで取得する
//!
//! 起動時にワーカースレッドを起動する

use std::{
    ffi::OsStr,
    path::PathBuf,
    sync::{mpsc, Arc},
    thread,
};

use anyhow::anyhow;

use crate::{
    file_operations::file_utils::read_metadata,
    state::{
        app_state::AppState,
        tab_info::{TabGeneration, TabInfo},
    },
    types::{Either, FileId, FileMetadata, TabId},
};

//----------------------------------------------------------------------------------------------------------------------

/// ワーカースレッドに投げるタスク
struct WorkerPacket {
    tab_id: TabId,
    generation: TabGeneration,

    list: Vec<FileId>,

    progress: usize,
    total: usize,
}
impl WorkerPacket {
    fn create(tab: &TabInfo, list: Vec<FileId>) -> Vec<Self> {
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
}

//----------------------------------------------------------------------------------------------------------------------

/// ワーカーのタスク処理を担当する
struct PacketExecutor {
    state: Arc<AppState>,
    packet: Arc<WorkerPacket>,
    done: u32,
}
impl PacketExecutor {
    fn new(state: Arc<AppState>, packet: Arc<WorkerPacket>) -> Self {
        PacketExecutor {
            state,
            packet,
            done: 0,
        }
    }
    // ファイルIDをファイル名に変換 (タブをロックする)
    fn get_dir_fileids_filenames(&self) -> anyhow::Result<(PathBuf, Vec<(FileId, Arc<OsStr>)>)> {
        let tab = self.state.get_tab(self.packet.tab_id)?;
        let tab = tab.read().unwrap();
        let mut ret: Vec<(FileId, Arc<OsStr>)> = Vec::new();
        for file_id in &self.packet.list {
            if let Some(file_info) = tab.get_file_info(*file_id) {
                if file_info.metadata.is_none() {
                    ret.push((*file_id, file_info.name.clone()));
                }
            }
        }
        let dir = tab
            .get_current_dir()
            .ok_or_else(|| anyhow!("BUG: no current_dir"))?;
        Ok((dir.to_path_buf(), ret))
    }
    // メタデータを一括取得 (時間がかかるので、タブをロックしない)
    fn read_metadatas(
        &mut self,
        dir: &PathBuf,
        filenames: &Vec<(u64, Arc<OsStr>)>,
    ) -> anyhow::Result<Vec<(u64, Either<FileMetadata, String>)>> {
        let ret: Vec<_> = filenames
            .iter()
            .map(|(file_id, name)| {
                let metadata = read_metadata(&dir, &name);
                (*file_id, metadata)
            })
            .collect();
        Ok(ret)
    }
    // メタデータを一括設定 (タブをロックする)
    fn write_metadata(
        &mut self,
        fileids_metadatas: Vec<(u64, Either<FileMetadata, String>)>,
    ) -> anyhow::Result<bool> {
        let tab = self
            .state
            .get_tab(self.packet.tab_id)
            .map_err(|e| anyhow!("state.get_tab err: {}", e))?;
        let mut tab = tab.write().unwrap();

        // タブ状態が変わっていたらキャンセル
        if !self.packet.generation.check_path(&tab) {
            return Ok(false);
        }

        for (file_id, metadata) in fileids_metadatas {
            tab.set_metadata_to_file_info(file_id, metadata)
                .map_err(|e| anyhow!("BUG: set_metadata err: {}", e))?;
            self.done += 1;
        }
        Ok(true)
    }

    // メタデータを取得してタブ情報に設定する
    // キャンセルされたら false を返す
    fn exec_or_cancel(&mut self) -> anyhow::Result<bool> {
        // タブ状態が変わっていたらキャンセル
        match self.state.get_tab(self.packet.tab_id) {
            Err(_) => return Ok(false),
            Ok(tab) => {
                if !self.packet.generation.check_path(&tab.read().unwrap()) {
                    return Ok(false);
                }
            }
        }

        // ファイルIDをファイル名に変換
        let (dir, fileids_filenames) = self.get_dir_fileids_filenames()?;
        // メタデータ読み込み
        let fileids_metadatas = self.read_metadatas(&dir, &fileids_filenames)?;
        // メタデータ書き込み
        Ok(self.write_metadata(fileids_metadatas)?)
    }
}

//----------------------------------------------------------------------------------------------------------------------

pub struct MetadataWorker {
    tx: mpsc::Sender<WorkerPacket>,
}
impl MetadataWorker {
    pub fn new(state: Arc<AppState>) -> Arc<Self> {
        let (tx, rx) = mpsc::channel::<WorkerPacket>();
        let ret = Arc::new(MetadataWorker { tx });
        let ret2 = ret.clone();

        // ワーカースレッド起動
        thread::spawn(move || loop {
            let packet = Arc::new(rx.recv().unwrap());
            let comment = format!("MetadataWorker worker(tab_id:{}): ", packet.tab_id);

            let mut exec = PacketExecutor::new(state.clone(), packet.clone());
            match exec.exec_or_cancel() {
                Err(e) => {
                    log::error!("{comment}{}", e);
                }
                Ok(success) => {
                    if exec.done != 0 {
                        log::debug!(
                            "{comment}read metadata ({}) {}/{}",
                            exec.done,
                            packet.progress,
                            packet.total
                        );
                    }
                    if packet.progress == packet.total {
                        let finish_msg = if success { "finish" } else { "[CANCELED]" };
                        log::debug!(
                            "{comment}get metadata total={} {}",
                            packet.total,
                            finish_msg
                        );
                    }
                }
            }
        });
        ret2
    }

    pub fn send_to_worker(&self, tab: &TabInfo, list: Vec<FileId>) {
        for list in WorkerPacket::create(tab, list) {
            self.tx.send(list).unwrap();
        }
    }
}
