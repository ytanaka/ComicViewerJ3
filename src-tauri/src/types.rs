use std::{ffi::OsStr, sync::Arc};

use serde::{Deserialize, Serialize};
use specta::Type;

// =====================================================================================================================
// fs.rs
// =====================================================================================================================

pub type TabId = u32;
pub type FileId = u64;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum Either<A, B> {
    Left(A),
    Right(B),
}
impl<A, B> Either<A, B> {
    pub fn left(&self) -> Option<&A> {
        match self {
            Either::Left(a) => Some(a),
            Either::Right(_) => None,
        }
    }

    pub fn right(&self) -> Option<&B> {
        match self {
            Either::Right(b) => Some(b),
            Either::Left(_) => None,
        }
    }
}

// u64 は JS の number に完全に変換できないが、53bitまでの値なら大丈夫
// ファイルid、ファイルサイズ、更新日時は 53bit 以内になるはず
// Rust の u64 を JS の number にするために、specta_typescript::Number を指定する (tauri_specta でエラーになる)

/// UIへ返すファイル一覧の要素
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct DirEntry {
    #[specta(type = specta_typescript::Number)]
    pub id: FileId,

    pub name: Arc<str>,
}

/// ファイルのソート条件
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
pub enum SortType {
    /// 名前でソート
    Name { asc: bool },
    /// 拡張子でソート
    Ext { asc: bool },
    /// ファイルサイズでソート
    Size { asc: bool },
    /// 更新日時でソート
    Time { asc: bool },
}
impl SortType {
    pub fn default() -> Self {
        Self::Name { asc: true }
    }
}

/// UIに返す詳細ファイル情報
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileInfo {
    pub name: Arc<str>, // OsString だと JS 側で byte[] になってしまうので、JSに返す構造体は String にする
    pub is_dir: bool,
    /// メタデータか、メタデータ取得時のエラーメッセージが入る
    pub metadata: Option<Either<FileMetadata, String>>,
}

/// Rust内部で使用するファイル情報
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileInfoOs {
    pub name: Arc<OsStr>,
    pub is_dir: bool,

    pub metadata: Option<Either<FileMetadata, String>>,
}
impl FileInfoOs {
    pub fn to_ui(&self) -> FileInfo {
        FileInfo {
            name: Arc::from(self.name.to_string_lossy()),
            is_dir: self.is_dir,
            metadata: self.metadata.clone(),
        }
    }
}

/// 詳細ファイル情報のメタデータ
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
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
    // ファイル名検索するとき
    pub debug_filename_search_sleep_ms: i32,
}
