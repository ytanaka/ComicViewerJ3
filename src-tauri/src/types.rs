use std::{ffi::OsStr, sync::Arc};

use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use specta::Type;

pub type TabId = u32;
pub type FileId = u64;

// =====================================================================================================================

/// 2つの型のどちらか片方だけ保持するための構造体
//
// XxxxxUI 構造体はRustからUIへ渡す型
// UI側で内部の number を別の型の type 宣言に置き換えて Xxxxx に変換して使用する
//
// XxxxxOS はRust側で使用する型。XxxxxUI と対になっている。
//
// Xxxxx はUI,Rust側共通で使用する型。
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum Either<A, B> {
    Left(A),
    Right(B),
}
impl<A, B> Either<A, B> {
    pub fn right(&self) -> Option<&B> {
        match self {
            Either::Right(b) => Some(b),
            Either::Left(_) => None,
        }
    }

    pub fn map_right<BB, F: Fn(B) -> BB>(self, f: F) -> Either<A, BB> {
        match self {
            Either::Left(l) => Either::Left(l),
            Either::Right(r) => Either::Right(f(r)),
        }
    }
}

// =====================================================================================================================
// fs.rs
// =====================================================================================================================

// u64 は JS の number に完全に変換できないが、53bitまでの値なら大丈夫
// ファイルid、ファイルサイズ、更新日時は 53bit 以内になるはず
// Rust の u64 を JS の number にするために、specta_typescript::Number を指定する (tauri_specta でエラーになる)

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct TabInfoUI {
    #[specta(type = specta_typescript::Number)]
    pub id: TabId,

    pub path: String,
}

/// create_tab*() の失敗情報 (指定されたディレクトリがないなど、システムエラーでない場合)
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct CreateTabError {
    pub msg: String,
}

/// UIへ返すファイル一覧の要素
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct DirEntryUI {
    #[specta(type = specta_typescript::Number)]
    pub file_id: FileId,

    pub is_dir: bool,
    pub is_symlink: bool,
    pub name: Arc<str>,
}

/// ファイルのソート条件
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
pub enum SortType {
    /// 名前でソート
    Name,
    /// 拡張子でソート
    Ext,
    /// ファイルサイズでソート
    Size,
    /// 更新日時でソート
    Time,
}
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct SortCondition {
    pub sort_type: SortType,
    /// 昇順: true
    pub asc: bool,
}
impl Default for SortCondition {
    fn default() -> Self {
        Self {
            sort_type: SortType::Name,
            asc: true,
        }
    }
}

/// UIに返す詳細ファイル情報
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileInfoUI {
    #[specta(type = specta_typescript::Number)]
    pub file_id: FileId,
    //  ※ FileInfoOS の metadata が Some でない場合はこの構造体は作成できない
    pub metadata: Arc<Either<String, FileMetadata>>,
}

#[derive(Clone)]
/// Rust内部で使用するファイル情報
pub struct FileInfoOS {
    pub name: Arc<OsStr>,
    pub is_dir: bool,
    pub is_symlink: bool,
    /// メタデータか、メタデータ取得時のエラーメッセージが入る
    pub metadata: Option<Arc<Either<String, FileMetadata>>>,
}
impl FileInfoOS {
    pub fn to_ui(&self, file_id: FileId) -> anyhow::Result<FileInfoUI> {
        Ok(FileInfoUI {
            file_id,
            metadata: self
                .metadata
                .clone()
                .ok_or_else(|| anyhow!("BUG: no metadata for `{}`", self.name.to_string_lossy()))?,
        })
    }
    pub fn get_size(&self) -> Option<u64> {
        self.get_metadata().and_then(|m| m.size)
    }
    pub fn get_modified(&self) -> Option<u64> {
        self.get_metadata().and_then(|m| m.modified)
    }
    fn get_metadata(&self) -> Option<&FileMetadata> {
        self.metadata.as_ref().and_then(|m| m.right())
    }
}

/// 詳細ファイル情報のメタデータ
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
pub struct FileMetadata {
    #[specta(type = Option<specta_typescript::Number>)]
    pub size: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub modified: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub accessed: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub created: Option<u64>,
}

// =====================================================================================================================
// migemo.rs
// =====================================================================================================================

/// ファイル検索結果
#[derive(Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
pub enum FileSearchResult {
    /// 見つかった
    Success {
        index: i32,        // ファイルのインデックス
        name: String,      // ファイル名
        match_str: String, // ファイル名の中のマッチした部分
    },
    /// 形態素解析が終わっていない
    FailNoMatch,
    /// 見つからなかった
    FailNoCache,
    /// 状態が変わったのでキャンセル
    Canceled,
}
impl FileSearchResult {
    pub fn new_success(index: usize, name: &str, start: usize, end: usize) -> Self {
        FileSearchResult::Success {
            index: index as i32,
            name: name.to_string(),
            match_str: name.get(start..end).unwrap_or("").to_string(),
        }
    }
}
impl std::fmt::Debug for FileSearchResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FileSearchResult::Success {
                index,
                name: _name,
                match_str,
            } => write!(f, "Success {{[{}] {}}}", index, match_str),
            FileSearchResult::FailNoCache => write!(f, "FailNoCache"),
            FileSearchResult::FailNoMatch => write!(f, "FailNoMatch"),
            FileSearchResult::Canceled => write!(f, "Canceled"),
        }
    }
}

// =====================================================================================================================
// preferences.rs
// =====================================================================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
pub struct AppPreferences {
    /// ファイル名検索するとき
    pub debug_filename_search_sleep_ms: i32,

    /// ファイル名ソート時の文字比較方法
    pub filename_cmp: FilenameCmpType,

    /// ファイル名ソート時のCollator設定 (icu_collator::options::Strength)
    /// 'Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Identical'
    pub filename_sort_strength: String,
}
impl AppPreferences {
    pub fn get_collator_options(&self) -> icu_collator::options::Strength {
        match self.filename_sort_strength.as_str() {
            "Primary" => icu_collator::options::Strength::Primary,
            "Secondary" => icu_collator::options::Strength::Secondary,
            "Tertiary" => icu_collator::options::Strength::Tertiary,
            "Quaternary" => icu_collator::options::Strength::Quaternary,
            _ => icu_collator::options::Strength::Identical,
        }
    }
    pub fn is_change_sort_config(&self, other: &AppPreferences) -> bool {
        self.filename_cmp != other.filename_cmp
            || self.filename_sort_strength != other.filename_sort_strength
    }
}

/// ファイル名ソート時の文字比較方法
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
#[serde(tag = "type")]
pub enum FilenameCmpType {
    /// Unicode文字コード順
    #[default]
    Unicode = 0,
    /// Shift-JIS
    Sjis,
    /// 自然
    Icu,
}

// =====================================================================================================================
// Event
// =====================================================================================================================

pub const EVENT_ID_FILE_NOTIFY: &str = "file-notify";

/// ファイル更新をUIに通知する
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileNotifyEvent {
    #[specta(type = specta_typescript::Number)]
    pub tab_id: TabId,

    #[specta(type = Option<specta_typescript::Number>)]
    pub file_id: Option<FileId>, // Someの場合は、そのファイルのサイズや更新日時が変更された場合
                                 // Noneの場合は、そのディレクトリを再読み込みする必要がある場合
}
