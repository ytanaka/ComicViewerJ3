use std::ffi::OsString;

use serde::{Deserialize, Serialize};
use specta::Type;

pub type TabId = u32;
pub type FileId = u64;

// u64 は JS の number に完全に変換できないが、53bitまでの値なら大丈夫
// ファイルid、ファイルサイズ、更新日時は 53bit 以内になるはず
// Rust の u64 を JS の number にするために、specta_typescript::Number を指定する (tauri_specta でエラーになる)

/// UIからのファイル一覧取得で返す要素
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct DirEntry {
    #[specta(type = specta_typescript::Number)]
    pub id: FileId,

    pub name: String,
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

/// 詳細ファイル情報
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileInfo {
    pub name: OsString,
    pub metadata: Option<FileMetadata>,
}

/// 詳細ファイル情報のメタデータ
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileMetadata {
    pub is_dir: bool,

    #[specta(type = Option<specta_typescript::Number>)]
    pub size: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub modified: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub accessed: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub created: Option<u64>,
}
