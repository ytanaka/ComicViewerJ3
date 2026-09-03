use std::{ffi::OsStr, sync::Arc};

use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use specta::Type;

pub type TabId = u32;
pub type FileId = u64;

// XyzUI 構造体はUIとやり取りするための型
// UI側で Xyz に変換して使用する
// UI側で内部の number を別の型の type 宣言に置き換えて Xyz に変換して使用する
//
// XyzOS は XyzUI と対になる
//
// Xyz はUI,Rust側共通

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

    // pub fn right(&self) -> Option<&B> {
    //     match self {
    //         Either::Right(b) => Some(b),
    //         Either::Left(_) => None,
    //     }
    // }

    // pub fn is_left(&self) -> bool {
    //     matches!(self, Either::Left(_))
    // }
    // pub fn is_right(&self) -> bool {
    //     !&self.is_left()
    // }
}

// =====================================================================================================================
// fs.rs
// =====================================================================================================================

// u64 は JS の number に完全に変換できないが、53bitまでの値なら大丈夫
// ファイルid、ファイルサイズ、更新日時は 53bit 以内になるはず
// Rust の u64 を JS の number にするために、specta_typescript::Number を指定する (tauri_specta でエラーになる)

/// UIへ返すファイル一覧の要素
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct DirEntryUI {
    #[specta(type = specta_typescript::Number)]
    pub file_id: FileId,

    pub is_dir: bool,
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
    //  ※ FileInfoOS の metadata が Some でない場合はこの構造体は作成できない
    pub metadata: Arc<Either<FileMetadata, String>>,
}

/// Rust内部で使用するファイル情報
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileInfoOS {
    pub name: Arc<OsStr>,
    pub is_dir: bool,
    /// メタデータか、メタデータ取得時のエラーメッセージが入る
    pub metadata: Option<Arc<Either<FileMetadata, String>>>,
}
impl FileInfoOS {
    pub fn to_ui(&self) -> anyhow::Result<FileInfoUI> {
        Ok(FileInfoUI {
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
        self.metadata.as_ref().and_then(|m| m.left())
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
    // ファイル名検索するとき
    pub debug_filename_search_sleep_ms: i32,
}
