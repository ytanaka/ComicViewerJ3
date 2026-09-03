//! UIのタブ1つに相当するRust側データ

use std::{
    collections::HashMap,
    ffi::OsStr,
    path::{Path, PathBuf},
    sync::Arc,
};

use anyhow::anyhow;

use crate::{
    file_sort::cmp_file,
    types::{DirEntryUI, Either, FileId, FileInfoOS, FileMetadata, SortCondition, TabId},
    util::to_unix_time,
};

#[derive(Debug, Clone)]
pub struct TabInfo {
    tab_id: TabId,

    current_dir: Option<PathBuf>, // タブ作成直後はNone

    files: HashMap<FileId, FileInfoOS>,
    file_names: HashMap<Arc<OsStr>, FileId>,

    sort_condition: SortCondition,
    sorted_list: Option<Vec<FileId>>, // files のキーを sort_type でソート。read_dir_entry(), get_dir_entry()が呼ばれたら files から生成する。ファイル監視通知で files が更新されたらNoneにする

    _pending_metadata: usize, // filesのmetada未取得の項目数。「ファイル名」以外でソートするときは取得済みである必要がある
    path_generation: u32, // current_dir が更新された回数。メタデータ取得タスクで比較して中止する
    sort_generation: u32, // sorted_list が更新された回数。ファイル名検索で比較して中断する
}
/// タブ状態が変化したかどうかを判定するためのヘルパークラス
pub struct TabGeneration {
    path: u32,
    sort: u32,
}
impl TabInfo {
    pub fn new(tab_id: TabId) -> Self {
        TabInfo {
            tab_id,
            current_dir: None,
            files: HashMap::new(),
            file_names: HashMap::new(),
            sort_condition: SortCondition::default(),
            sorted_list: None,
            _pending_metadata: 0,
            path_generation: 0,
            sort_generation: 0,
        }
    }
    pub fn get_current_dir(&self) -> Option<&Path> {
        self.current_dir.as_deref()
    }
    pub fn get_generation(&self) -> TabGeneration {
        TabGeneration {
            path: self.path_generation,
            sort: self.sort_generation,
        }
    }
    pub fn check(&self, gen: &TabGeneration) -> bool {
        self.path_generation == gen.path && self.sort_generation == gen.sort
    }

    pub fn set_files(&mut self, current_dir: PathBuf, files: HashMap<FileId, FileInfoOS>) {
        self.current_dir = Some(current_dir);
        self.files.clear();
        self.file_names.clear();
        self.sort_condition = SortCondition::default();
        self.sorted_list = None;
        self.path_generation += 1;
        self.sort_generation += 1;

        for (i, f) in files {
            self.file_names.insert(f.name.clone(), i);
            self.files.insert(i, f);
        }
    }

    fn sort_items(&mut self) {
        let mut list: Vec<_> = self.files.keys().copied().collect();
        list.sort_by(|a, b| {
            let a = self.files.get(a).unwrap();
            let b = self.files.get(b).unwrap();
            cmp_file(&self.sort_condition, a, b)
        });
        self.sorted_list = Some(list);
        self.sort_generation += 1;
    }

    // ソート済みのファイルIDリストを取得 (未ソートの場合はソートする)
    pub fn get_sorted_list(&mut self) -> Vec<FileId> {
        if self.sorted_list.is_none() {
            self.sort_items();
        }
        let x = self.sorted_list.clone();
        x.unwrap()
    }

    /// UI表示用のファイル一覧を取得
    pub fn create_dir_entries(&mut self) -> Vec<DirEntryUI> {
        let mut ret: Vec<DirEntryUI> = Vec::new();
        for i in self.get_sorted_list() {
            if let Some(info) = self.files.get(&i) {
                ret.push(DirEntryUI {
                    file_id: i,
                    is_dir: info.is_dir,
                    name: Arc::from(info.name.to_string_lossy()),
                });
            }
        }
        ret
    }

    pub fn get_file(&self, file_id: FileId) -> Option<FileInfoOS> {
        self.files.get(&file_id).cloned()
    }

    // ファイル情報取得 (メタデータが未取得の場合は取得する)
    pub fn get_file_info(&mut self, file_id: FileId) -> anyhow::Result<FileInfoOS> {
        let current_dir = self
            .current_dir
            .as_ref()
            .ok_or(anyhow!("not initialized tab: {}", self.tab_id))?;
        let file_info = self.files.get_mut(&file_id).ok_or(anyhow!(
            "invalid file_id: {} for tab_id[{}]",
            file_id,
            self.tab_id
        ))?;
        if file_info.metadata.is_some() {
            return Ok(file_info.clone());
        }
        match current_dir.join(&*file_info.name).metadata() {
            Err(err) => {
                file_info.metadata = Some(Arc::new(Either::Right(err.to_string())));
            }
            Ok(metadata) => {
                file_info.metadata = Some(Arc::new(Either::Left(FileMetadata {
                    size: if file_info.is_dir {
                        None
                    } else {
                        Some(metadata.len())
                    },
                    created: to_unix_time(metadata.created()),
                    modified: to_unix_time(metadata.modified()),
                    accessed: to_unix_time(metadata.accessed()),
                })));
            }
        };
        Ok(file_info.clone())
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use maplit::hashmap;

    use crate::{
        state::app_state::{AppState, START_FILE_ID},
        types::SortType,
    };

    use super::*;

    fn mk_dummy_files(state: &AppState, file_names: Vec<&str>) -> HashMap<FileId, FileInfoOS> {
        let mut ret = HashMap::new();
        for fname in file_names {
            ret.insert(
                state
                    .next_file_id
                    .fetch_add(1, std::sync::atomic::Ordering::SeqCst),
                FileInfoOS {
                    name: Arc::from(OsStr::new(fname)),
                    is_dir: false,
                    metadata: None,
                },
            );
        }
        ret
    }

    #[test]
    fn test_tab_info() {
        let mut tab = TabInfo::new(123);
        let state = AppState::new();

        // 初期状態を確認
        assert_eq!(tab.current_dir, None);

        // データの準備
        let current_dir = PathBuf::from("/a/b/c");
        let files = mk_dummy_files(&state, vec!["f1.txt", "f2.txt", "f3.txt"]);
        tab.sort_condition = SortCondition {
            sort_type: SortType::Ext,
            asc: false,
        };
        tab.set_files(current_dir.clone(), files.clone());

        // データを set した結果を確認
        assert_eq!(tab.current_dir, Some(current_dir.clone()));
        assert_eq!(tab.files, files);
        assert_eq!(
            tab.file_names,
            hashmap! {
                Arc::from(OsStr::new("f1.txt")) => START_FILE_ID + 0,
                Arc::from(OsStr::new("f2.txt")) => START_FILE_ID + 1,
                Arc::from(OsStr::new("f3.txt")) => START_FILE_ID + 2
            }
        );
        assert_eq!(tab.sort_condition, SortCondition::default()); // 初期状態に戻っている

        let dir_entries = tab.create_dir_entries();
        assert_eq!(dir_entries.len(), 3);
        assert_eq!(dir_entries[0].name, Arc::from("f1.txt"));
        assert_eq!(dir_entries[1].name, Arc::from("f2.txt"));
        assert_eq!(dir_entries[2].name, Arc::from("f3.txt"));

        // 空のデータをセットする
        tab.set_files(current_dir.clone(), HashMap::new());
        assert!(tab.files.is_empty());
        assert!(tab.file_names.is_empty());
    }
}
