use std::{collections::HashMap, sync::Mutex};

use crate::types::{DirEntry, FileInfo};

pub struct AppState {
    pub new_file_id: Mutex<u64>,
    pub file_infos: Mutex<FileInfos>,
}
impl AppState {
    pub fn new() -> Self {
        AppState {
            new_file_id: Mutex::new(0),

            // FileInfos のメンバーを操作するときに個別にロックするとデッドロックの危険があるので、構造体に入れてまとめてロックする
            file_infos: Mutex::new(FileInfos {
                map: HashMap::new(),
                list: Vec::new(),
            }),
        }
    }
}

pub struct FileInfos {
    pub map: HashMap<u64, FileInfo>,
    pub list: Vec<u64>,
}
impl FileInfos {
    pub fn set_files(&mut self, files: Vec<FileInfo>) {
        self.list.clear();
        self.map.clear();

        for i in files {
            self.list.push(i.id);
            self.map.insert(i.id, i);
        }

        self.sort_items();
    }

    pub fn sort_items(&mut self) {
        self.list.sort_by(|a, b| {
            let a = self.map.get(a).unwrap();
            let b = self.map.get(b).unwrap();
            a.path.file_name().cmp(&b.path.file_name())
        });
    }

    /// UI表示用にソート済みのファイル一覧を取得
    pub fn get_dir_entries(&mut self) -> Vec<DirEntry> {
        let mut ret: Vec<DirEntry> = Vec::new();
        for i in &self.list {
            if let Some(info) = self.map.get(i) {
                if let Some(name) = info.path.file_name() {
                    ret.push(DirEntry {
                        id: *i,
                        name: name.to_string_lossy().to_string(),
                    });
                }
            }
        }
        ret
    }
}
