use std::{collections::HashMap, ffi::OsString, path::PathBuf};

use anyhow::anyhow;

use crate::{
    types::{DirEntry, FileId, FileInfoOs, FileMetadata, SortType, TabId},
    util::to_unix_time,
};

#[derive(Debug, Clone)]
pub struct TabInfo {
    tab_id: TabId,
    next_file_id: FileId,

    current_dir: Option<PathBuf>, // タブ作成直後はNone

    files: HashMap<FileId, FileInfoOs>,
    file_names: HashMap<OsString, FileId>,

    sort_type: SortType,
    sorted_list: Option<Vec<FileId>>, // files のキーを sort_type でソート。read_dir_entry(), get_dir_entry()が呼ばれたら files から生成する。ファイル監視通知で files が更新されたらNoneにする

    _pending_metadata: usize, // filesのmetada未取得の項目数。「ファイル名」以外でソートするときは取得済みである必要がある
    _tab_generation: u64, // current_dir が更新された回数。メタデータ取得タスクで比較して処理が必要かどうかを判定する
}
impl TabInfo {
    pub fn inc_file_id(&mut self) -> FileId {
        let ret = self.next_file_id;
        self.next_file_id += 1;
        ret
    }
    pub fn new(tab_id: TabId) -> Self {
        TabInfo {
            tab_id,
            next_file_id: 1,
            current_dir: None,
            files: HashMap::new(),
            file_names: HashMap::new(),
            sort_type: SortType::default(),
            sorted_list: None,
            _pending_metadata: 0,
            _tab_generation: 1,
        }
    }
    pub fn set_files(&mut self, current_dir: PathBuf, files: HashMap<FileId, FileInfoOs>) {
        self.current_dir = Some(current_dir);
        self.files.clear();
        self.file_names.clear();
        self.sort_type = SortType::default();
        self.sorted_list = None;

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
            a.name.cmp(&b.name)
        });
        self.sorted_list = Some(list);
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
    pub fn create_dir_entries(&mut self) -> Vec<DirEntry> {
        let mut ret: Vec<DirEntry> = Vec::new();
        for i in self.get_sorted_list() {
            if let Some(info) = self.files.get(&i) {
                ret.push(DirEntry {
                    id: i,
                    name: info.name.to_string_lossy().to_string(),
                });
            }
        }
        ret
    }

    pub fn get_file(&self, file_id: FileId) -> Option<FileInfoOs> {
        self.files.get(&file_id).map(|f| f.clone())
    }

    // ファイル情報取得 (メタデータが未取得の場合は取得する)
    pub fn get_file_info(&mut self, file_id: FileId) -> anyhow::Result<FileInfoOs> {
        let current_dir = self
            .current_dir
            .as_ref()
            .ok_or(anyhow!("not initialized tab: {}", self.tab_id))?;
        let file_info = self.files.get_mut(&file_id).ok_or(anyhow!(
            "invalid file_id: {} for tab_id[{}]",
            file_id,
            self.tab_id
        ))?;
        if file_info.metadata.is_some() || file_info.metadata_error.is_some() {
            return Ok(file_info.clone());
        }
        match current_dir.join(&file_info.name).metadata() {
            Err(err) => {
                file_info.metadata_error = Some(err.to_string());
            }
            Ok(metadata) => {
                file_info.metadata = Some(FileMetadata {
                    is_dir: metadata.is_dir(),
                    size: Some(metadata.len()),
                    created: to_unix_time(metadata.created()),
                    modified: to_unix_time(metadata.modified()),
                    accessed: to_unix_time(metadata.accessed()),
                });
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

    use super::*;

    fn mk_dummy_files(tab: &mut TabInfo, file_names: Vec<&str>) -> HashMap<FileId, FileInfoOs> {
        let mut ret = HashMap::new();
        for fname in file_names {
            ret.insert(
                tab.inc_file_id(),
                FileInfoOs {
                    name: OsString::from(fname),
                    metadata: None,
                    metadata_error: None,
                },
            );
        }
        ret
    }

    #[test]
    fn test_tab_info() {
        let mut tab = TabInfo::new(123);

        // 初期状態を確認
        assert_eq!(tab.current_dir, None);

        // データの準備
        let current_dir = PathBuf::from("/a/b/c");
        let files = mk_dummy_files(&mut tab, vec!["f1.txt", "f2.txt", "f3.txt"]);
        tab.sort_type = SortType::Size { asc: false };
        tab.set_files(current_dir.clone(), files.clone());

        // データを set した結果を確認
        assert_eq!(tab.current_dir, Some(current_dir.clone()));
        assert_eq!(tab.files, files);
        assert_eq!(
            tab.file_names,
            hashmap! { OsString::from("f1.txt") => 1, OsString::from("f2.txt") => 2, OsString::from("f3.txt") => 3 }
        );
        assert_eq!(tab.sort_type, SortType::default()); // 初期状態に戻っている

        let dir_entries = tab.create_dir_entries();
        assert_eq!(dir_entries.len(), 3);
        assert_eq!(dir_entries[0].name, "f1.txt");
        assert_eq!(dir_entries[1].name, "f2.txt");
        assert_eq!(dir_entries[2].name, "f3.txt");

        // 空のデータをセットする
        tab.set_files(current_dir.clone(), HashMap::new());
        assert!(tab.files.is_empty());
        assert!(tab.file_names.is_empty());
    }
}
