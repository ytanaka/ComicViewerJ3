//! UIのタブ1つに相当するRust側データ

use std::{
    collections::HashMap,
    ffi::OsStr,
    path::{Path, PathBuf},
    sync::Arc,
};

use anyhow::anyhow;

use crate::{
    file_operations::{
        file_sort::{cmp_file, mk_filename_cmp, FilenameCmpSupplement},
        file_utils::read_metadata,
        file_watcher::FileWatcher,
        sjis_cnv::SJIS_CACHE,
    },
    state::app_state::AppState,
    types::{
        DirEntryUI, Either, FileId, FileInfoOS, FileMetadata, SortCondition, TabId, TabInfoUI,
    },
};

// =====================================================================================================================

pub type TabGeneration = u32;
pub struct TabInfo {
    tab_id: TabId,
    path: PathBuf,
    files: HashMap<FileId, FileInfoOS>,
    file_names: HashMap<Arc<OsStr>, FileId>, // ファイル更新検知からファイル名が渡されるので逆引きのために使用する

    // ↑↑↑ ここまでは構造体作成時に設定され、不変
    //     ※ files の中の FileInfo は、ファイル監視から通知が来たときに変更されることがある
    //
    sort_condition: SortCondition, // デフォルトはNameなのでソート可能。Size,Timeに変更するには is_sortable() == true にならなければならない
    sorted_list: Option<Vec<FileId>>, // files のキーを sort_condition でソート。必要な時に files から生成する。ファイル監視通知で files が更新されたらNoneにする

    metadata_loaded_count: usize, // filesのmetada未取得の項目数。Size,Time でソートするときは全部取得済みである必要がある (MetadataWorkerから更新される)
    generation: TabGeneration, // sorted_list が更新された回数。ファイル名検索中に参照して中断する

    file_watcher: FileWatcher,

    state: Arc<AppState>,
}
impl TabInfo {
    pub fn new(
        tab_id: TabId,
        path: impl AsRef<Path>,
        files: HashMap<FileId, FileInfoOS>,
        file_watcher: FileWatcher,
        state: Arc<AppState>,
    ) -> Self {
        let mut ret = TabInfo {
            tab_id,
            path: path.as_ref().to_path_buf(),
            files: HashMap::new(),
            file_names: HashMap::new(),
            sort_condition: SortCondition::default(),
            sorted_list: None,
            metadata_loaded_count: 0,
            generation: 0,
            file_watcher,
            state,
        };
        for (i, f) in files {
            ret.file_names.insert(f.name.clone(), i);
            ret.files.insert(i, f);
        }
        ret
    }
    pub fn get_id(&self) -> TabId {
        self.tab_id
    }
    pub fn get_path(&self) -> &Path {
        &self.path
    }
    pub fn destroy(&mut self) {
        self.file_watcher.stop();
    }
    pub fn get_generation(&self) -> TabGeneration {
        self.generation
    }
    pub fn check_generation(&self, gen: TabGeneration) -> bool {
        self.generation == gen
    }
    pub fn add_metadata_loaded_count(&mut self, n: usize) {
        self.metadata_loaded_count += n;
    }
    pub fn set_sort_condition(&mut self, sort_condition: SortCondition) -> bool {
        if !self.is_sortable(&sort_condition) {
            return false;
        }
        self.sort_condition = sort_condition;
        self.sorted_list = None;
        true
    }
    /// ソート可能状態かどうか判定
    /// return ソート条件 == (Name,Ext) or メタデータ読み込み済み
    fn is_sortable(&self, sort_condition: &SortCondition) -> bool {
        match sort_condition.sort_type {
            crate::types::SortType::Name | crate::types::SortType::Ext => true,
            _ => self.metadata_loaded_count == self.files.len(),
        }
    }
    pub fn invalidate_sort_list(&mut self) {
        self.sorted_list = None;
    }

    fn sort_items(&mut self) {
        let cmp = mk_filename_cmp(&self.state);
        let mut cmp_supp = FilenameCmpSupplement::new(SJIS_CACHE.lock().unwrap());
        let need_metadata = !matches!(
            self.sort_condition.sort_type,
            crate::types::SortType::Name | crate::types::SortType::Ext
        );

        let mut list: Vec<_> = self.files.keys().copied().collect();
        list.sort_by(|a, b| {
            // この関数は MetadataWorkerでメタデータ取得完了前にも呼ばれることがある。(タブ作成直後のget_dir_entries()で)
            // その場合はソートにメタデータは不要。
            if need_metadata {
                // ここに来るのはファイル監視からの通知でメタデータがクリアたときだけのはず
                let _ = self.load_metadata(*a);
                let _ = self.load_metadata(*b);
            }
            let a = self.files.get(a).unwrap();
            let b = self.files.get(b).unwrap();
            cmp_file(a, b, &self.sort_condition, cmp.as_ref(), &mut cmp_supp)
        });
        self.sorted_list = Some(list);
        self.generation += 1;
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

    pub fn get_file_info(&self, file_id: FileId) -> anyhow::Result<&FileInfoOS> {
        let ret = self
            .files
            .get(&file_id)
            .ok_or_else(|| anyhow!("no file[{}] for tab[{}]", file_id, self.tab_id))?;
        Ok(ret)
    }
    fn get_file_info_mut(&mut self, file_id: FileId) -> anyhow::Result<&mut FileInfoOS> {
        let ret = self
            .files
            .get_mut(&file_id)
            .ok_or_else(|| anyhow!("no file[{}] for tab[{}]", file_id, self.tab_id))?;
        Ok(ret)
    }

    // MetadataWorker のスレッドで一括取得されたメタデータを設定する
    pub fn set_metadata(
        &mut self,
        file_id: FileId,
        metadata: Either<String, FileMetadata>,
    ) -> anyhow::Result<()> {
        let file_info = self.get_file_info_mut(file_id)?;
        file_info.metadata = Some(Arc::new(metadata));
        Ok(())
    }

    // UIから取得依頼の来たファイル情報を取得する
    // ※ まだ未取得なら取得して設定しておく
    pub fn load_metadata(&mut self, file_id: FileId) -> anyhow::Result<()> {
        let file_info = self.get_file_info(file_id)?;
        if file_info.metadata.is_some() {
            return Ok(());
        }
        let meta = read_metadata(&self.path, &file_info.name);
        let file_info = self.get_file_info_mut(file_id)?;
        file_info.metadata = Some(Arc::new(meta));
        Ok(())
    }

    pub fn to_ui(&self) -> TabInfoUI {
        TabInfoUI {
            id: self.get_id(),
            path: self.get_path().to_string_lossy().to_string(),
        }
    }

    // ファイル変更通知で1つのファイル内容が変更されたときに呼ばれる
    pub fn handle_modify_file(&mut self, filename: &OsStr) -> Option<FileId> {
        let ret = self.file_names.get(filename);
        if let Some(file_id) = ret {
            if let Some(f) = self.files.get_mut(file_id) {
                f.metadata = None;
                self.sorted_list = None;
            }
        }
        ret.copied()
    }
}

// =============================================================================================
//
// #####################   #####################      ###############      #####################
// #####################   #####################      ###############      #####################
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###                              ###
//          ###            ###                     ###                              ###
//          ###            ###############            ###############               ###
//          ###            ###############            ###############               ###
//          ###            ###                                       ###            ###
//          ###            ###                                       ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            #####################      ###############               ###
//          ###            #####################      ###############               ###
//
// =============================================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use maplit::hashmap;

    use crate::state::{
        app_state::{AppState, START_FILE_ID},
        util::{AppContext, DummyAppHandle},
    };

    fn app() -> AppContext<DummyAppHandle> {
        AppContext::new(DummyAppHandle {})
    }
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
        let state = Arc::new(AppState::new());
        state.init_for_test();
        let files = mk_dummy_files(&state, vec!["f1.txt", "f2.txt", "f3.txt"]);
        let watcher = FileWatcher::new(app(), &state, 123, "/a/b/c").unwrap();
        let mut tab = TabInfo::new(123, "/a/b/c", files, watcher, state.clone());

        let mut list: Vec<_> = tab
            .files
            .values()
            .map(|f| f.name.to_string_lossy().to_string())
            .collect();
        list.sort();
        assert_eq!(list, vec!["f1.txt", "f2.txt", "f3.txt",]);
        assert_eq!(
            tab.file_names,
            hashmap! {
                Arc::from(OsStr::new("f1.txt")) => START_FILE_ID + 0,
                Arc::from(OsStr::new("f2.txt")) => START_FILE_ID + 1,
                Arc::from(OsStr::new("f3.txt")) => START_FILE_ID + 2
            }
        );
        assert_eq!(tab.sort_condition, SortCondition::default());

        let dir_entries = tab.create_dir_entries();
        assert_eq!(dir_entries.len(), 3);
        assert_eq!(dir_entries[0].name, Arc::from("f1.txt"));
        assert_eq!(dir_entries[1].name, Arc::from("f2.txt"));
        assert_eq!(dir_entries[2].name, Arc::from("f3.txt"));
    }
}
