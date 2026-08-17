use std::{
    collections::HashMap,
    ffi::OsString,
    path::PathBuf,
    sync::{atomic::AtomicU32, Arc, RwLock},
};

use dashmap::DashMap;

use crate::{
    types::{DirEntry, FileId, FileInfo, FileMetadata, SortType, TabId},
    util::to_unix_time,
};

pub struct AppState {
    pub next_tab_id: AtomicU32,
    pub tabs: DashMap<TabId, Arc<RwLock<TabInfo>>>,
}
impl AppState {
    pub fn new() -> Self {
        AppState {
            next_tab_id: AtomicU32::new(0),
            tabs: DashMap::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct TabInfo {
    pub tab_id: TabId,

    pub current_dir: Option<PathBuf>, // タブ作成直後はNone
    pub next_file_id: FileId,

    pub files: HashMap<FileId, FileInfo>,
    pub file_names: HashMap<OsString, FileId>,

    sort_type: SortType,
    pub sorted_list: Option<Vec<FileId>>, // files のキーを sort_type でソート。read_dir_entry(), get_dir_entry()が呼ばれたら files から生成する。ファイル監視通知で files が更新されたらNoneにする

    pending_metadata: usize, // filesのmetada未取得の項目数。「ファイル名」以外でソートするときは取得済みである必要がある
    tab_generation: u64, // current_dir が更新された回数。メタデータ取得タスクで比較して処理が必要かどうかを判定する
}
impl TabInfo {
    pub fn new(tab_id: TabId) -> Self {
        TabInfo {
            tab_id,
            current_dir: None,
            next_file_id: 1,
            files: HashMap::new(),
            file_names: HashMap::new(),
            sort_type: SortType::Name(true),
            sorted_list: None,
            pending_metadata: 0,
            tab_generation: 1,
        }
    }
}

impl TabInfo {
    pub fn set_files(&mut self, current_dir: PathBuf, files: HashMap<FileId, FileInfo>) {
        self.current_dir = Some(current_dir);
        self.files.clear();
        self.file_names.clear();
        self.sorted_list = None;

        for (i, f) in files {
            self.file_names.insert(f.name.clone(), i);
            self.files.insert(i, f);
        }
    }

    pub fn sort_items(&mut self) {
        let mut list = Vec::<FileId>::with_capacity(self.files.len());
        list.sort_by(|a, b| {
            let a = self.files.get(a).unwrap();
            let b = self.files.get(b).unwrap();
            a.name.cmp(&b.name)
        });
        self.sorted_list = Some(list);
    }

    /// UI表示用にソート済みのファイル一覧を取得
    pub fn get_dir_entries(&mut self) -> Vec<DirEntry> {
        if self.sorted_list.is_none() {
            self.sort_items();
        }

        let mut ret: Vec<DirEntry> = Vec::new();
        for i in self.sorted_list.as_ref().unwrap() {
            if let Some(info) = self.files.get(i) {
                ret.push(DirEntry {
                    id: *i,
                    name: info.name.to_string_lossy().to_string(),
                });
            }
        }
        ret
    }

    pub fn get_file_info(&mut self, file_id: FileId) -> Result<FileInfo, String> {
        let current_dir = self
            .current_dir
            .as_ref()
            .ok_or(format!("not initialized tab: {}", self.tab_id))?;
        let file_info = self.files.get_mut(&file_id).ok_or(format!(
            "invalid tab_id: {}, file_id: {}",
            self.tab_id, file_id
        ))?;
        let metadata = current_dir
            .join(&file_info.name)
            .metadata()
            .map_err(|e| e.to_string())?;
        file_info.metadata = Some(FileMetadata {
            is_dir: metadata.is_dir(),
            size: Some(metadata.len()),
            created: to_unix_time(metadata.created()),
            modified: to_unix_time(metadata.modified()),
            accessed: to_unix_time(metadata.accessed()),
        });
        Ok(file_info.clone())
    }
}
