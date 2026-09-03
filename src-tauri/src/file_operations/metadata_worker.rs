//! ファイルメタデータをバックグラウンドで取得する

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
    types::{FileId, TabId},
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

    /// タブが存在して、ディレクトリが変わっていないことを確認
    /// 変わっていたら、タスクをキャンセルする (ソート状態が変わっただけならOK)
    fn check_tab(&self, state: &AppState) -> bool {
        match state.get_tab(self.tab_id) {
            Err(_) => false,
            Ok(tab) => self.generation.check_path(&tab.read().unwrap()),
        }
    }
    fn check_tab2(&self, tab: &TabInfo) -> bool {
        self.generation.check_path(tab)
    }
}

//----------------------------------------------------------------------------------------------------------------------

pub struct MetadataWorker {
    state: Arc<AppState>,
    tx: mpsc::Sender<WorkerPacket>,
}
impl MetadataWorker {
    pub fn new(state: Arc<AppState>) -> Arc<Self> {
        let (tx, rx) = mpsc::channel::<WorkerPacket>();
        let ret = Arc::new(MetadataWorker {
            state: state.clone(),
            tx,
        });
        let ret2 = ret.clone();

        // ワーカースレッド起動
        thread::spawn(move || loop {
            let packet = rx.recv().unwrap();
            let comment = format!("MetadataWorker worker(tab_id:{}): ", packet.tab_id);

            // ファイルIDをファイル名に変換
            let get_filenames =
                |file_ids: &Vec<FileId>| -> anyhow::Result<(PathBuf, Vec<(FileId, Arc<OsStr>)>)> {
                    let tab = ret.state.get_tab(packet.tab_id)?;
                    let tab = tab.read().unwrap();
                    let mut ret: Vec<(FileId, Arc<OsStr>)> = Vec::new();
                    for file_id in file_ids {
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
                };

            // タブ状態が変わっていたらキャンセル
            if !packet.check_tab(&state) {
                continue;
            }

            let mut done = 0;
            let mut read_metadatas_and_write_file_info = || -> anyhow::Result<()> {
                // ファイルIDをファイル名に変換
                let (dir, filenames) =
                    get_filenames(&packet.list).map_err(|e| anyhow!("get_filenames err: {}", e))?;

                // メタデータを一括取得 (タブをロックしない)
                let file_id_metadata_list: Vec<_> = filenames
                    .iter()
                    .map(|(file_id, name)| {
                        let metadata = read_metadata(&dir, &name);
                        (file_id, metadata)
                    })
                    .collect();

                // メタデータを一括設定 (タブをロックする)
                let tab = ret
                    .state
                    .get_tab(packet.tab_id)
                    .map_err(|e| anyhow!("state.get_tab err: {}", e))?;
                let mut tab = tab.write().unwrap();
                if !packet.check_tab2(&tab) {
                    // タブ状態が変わっていたらキャンセル
                    return Ok(());
                }
                for (file_id, metadata) in file_id_metadata_list {
                    tab.set_metadata_to_file_info(*file_id, metadata)
                        .map_err(|e| anyhow!("set_metadata err: {}", e))?;
                    done += 1;
                }
                Ok(())
            };
            match read_metadatas_and_write_file_info() {
                Err(e) => log::error!("{comment}{}", e),
                Ok(()) => {}
            };

            if done != 0 {
                log::debug!(
                    "{comment}read meetadata ({}) {}/{}",
                    done,
                    packet.progress,
                    packet.total
                );
            }
            if packet.progress == packet.total {
                let canceled = if packet.check_tab(&state) {
                    " [CANCELED]"
                } else {
                    ""
                };
                log::debug!(
                    "{comment}get metadata total={} finish{}",
                    packet.total,
                    canceled
                );
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
