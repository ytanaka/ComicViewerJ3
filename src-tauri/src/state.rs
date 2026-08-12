use std::{collections::HashMap, sync::Mutex};

use crate::types::{DirEntry, FileInfo};

pub struct AppState {
    pub new_id: Mutex<u64>,
    pub item_map: Mutex<HashMap<u64, FileInfo>>,
    pub item_list: Mutex<Vec<u64>>,
}

impl AppState {
    pub fn set_files(&self, files: Vec<FileInfo>) {
        {
            let mut list = self.item_list.lock().unwrap();
            list.clear();
            let mut map = self.item_map.lock().unwrap();
            map.clear();

            for i in files {
                list.push(i.id);
                map.insert(i.id, i);
            }
        }
        self.sort_items();
    }

    pub fn sort_items(&self) {
        let map = self.item_map.lock().unwrap();
        let mut list = self.item_list.lock().unwrap();

        list.sort_by(|a, b| {
            let a = map.get(a).unwrap();
            let b = map.get(b).unwrap();
            a.path.file_name().cmp(&b.path.file_name())
        });
    }

    pub fn get_dir_entries(&self) -> Vec<DirEntry> {
        let map = self.item_map.lock().unwrap();
        let mut ret: Vec<DirEntry> = Vec::new();
        for i in self.item_list.lock().unwrap().clone() {
            if let Some(info) = map.get(&i) {
                if let Some(name) = info.path.file_name() {
                    ret.push(DirEntry {
                        id: i,
                        name: name.to_string_lossy().to_string(),
                    });
                }
            }
        }
        ret
    }
}
