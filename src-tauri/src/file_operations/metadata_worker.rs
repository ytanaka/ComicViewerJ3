//! ファイルメタデータをバックグラウンドで取得する
//!
//! 起動時にワーカースレッドを起動する

use std::{
    ffi::OsStr,
    path::{Path, PathBuf},
    sync::{mpsc, Arc},
    thread,
};

use anyhow::anyhow;

use crate::{
    file_operations::file_utils::read_metadata,
    state::app_state::AppState,
    types::{Either, FileId, FileMetadata, TabId},
};

//----------------------------------------------------------------------------------------------------------------------

/// ワーカースレッドに投げるタスク
struct WorkerPacket {
    tab_id: TabId,
    path: PathBuf,
    list: Vec<FileId>,

    progress: usize,
    total: usize,
}
impl WorkerPacket {
    fn create(tab_id: TabId, path: impl AsRef<Path>, list: Vec<FileId>) -> Vec<Self> {
        let list2: Vec<_> = list.chunks(1000).map(|c| c.to_vec()).collect();
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
}

//----------------------------------------------------------------------------------------------------------------------

/// ワーカーのタスク処理を担当する
struct PacketExecutor {
    state: Arc<AppState>,
    packet: Arc<WorkerPacket>,
    done: u32,
}
type FileIdT<T> = Vec<(FileId, T)>;
type FileIdOsStr = FileIdT<Arc<OsStr>>;
type FileIdMetadata = FileIdT<Either<String, FileMetadata>>;

impl PacketExecutor {
    fn new(state: Arc<AppState>, packet: Arc<WorkerPacket>) -> Self {
        PacketExecutor {
            state,
            packet,
            done: 0,
        }
    }
    // ファイルIDをファイル名に変換 (タブをロックする)
    fn get_fileids_filenames(&self) -> anyhow::Result<FileIdOsStr> {
        let tab = self.state.get_tab(self.packet.tab_id)?;
        let tab = tab.read().unwrap();
        let mut ret: Vec<(FileId, Arc<OsStr>)> = Vec::new();
        for file_id in &self.packet.list {
            if let Ok(file_info) = tab.get_file_info(*file_id) {
                // メタデータ取得済みの場合は無視する
                if file_info.metadata.is_none() {
                    ret.push((*file_id, file_info.name.clone()));
                }
            }
        }
        Ok(ret)
    }
    // メタデータを一括取得 (時間がかかるので、タブをロックしない)
    fn read_metadatas(
        &mut self,
        filenames: &[(FileId, Arc<OsStr>)],
    ) -> anyhow::Result<FileIdMetadata> {
        let ret: Vec<_> = filenames
            .iter()
            .map(|(file_id, name)| {
                let metadata = read_metadata(&self.packet.path, name);
                (*file_id, metadata)
            })
            .collect();
        Ok(ret)
    }
    // メタデータを一括設定 (タブをロックする)
    fn write_metadata(&mut self, fileids_metadatas: FileIdMetadata) -> anyhow::Result<()> {
        let tab = match self.state.get_tab(self.packet.tab_id) {
            Ok(tab) => tab,
            Err(_) => return Ok(()), // タブがなくなっていたらキャンセル
        };
        let mut tab = tab.write().unwrap();

        for (file_id, metadata) in fileids_metadatas {
            tab.set_metadata(file_id, metadata)
                .map_err(|e| anyhow!("BUG: set_metadata err: {}", e))?;
            self.done += 1;
        }

        // 処理済み数更新
        tab.add_metadata_loaded_count(self.packet.list.len());

        Ok(())
    }

    // メタデータを取得してタブ情報に設定する
    // キャンセルされたら false を返す
    fn exec_or_cancel(&mut self) -> anyhow::Result<bool> {
        // タブがなくなっていたらキャンセル
        if self.state.get_tab(self.packet.tab_id).is_err() {
            return Ok(false);
        }

        // ファイルIDをファイル名に変換
        let fileids_filenames = self.get_fileids_filenames()?;
        // メタデータ読み込み
        let fileids_metadatas = self.read_metadatas(&fileids_filenames)?;
        // メタデータ書き込み
        self.write_metadata(fileids_metadatas)?;

        Ok(true)
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

    pub fn send_to_worker(&self, tab_id: TabId, path: impl AsRef<Path>, list: Vec<FileId>) {
        for list in WorkerPacket::create(tab_id, path, list) {
            self.tx.send(list).unwrap();
        }
    }
}
