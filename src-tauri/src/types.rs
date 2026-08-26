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
    pub name: String, // OsString だと JS 側で byte[] になってしまうので、JSに返す構造体は String にする
    pub metadata: Option<FileMetadata>,
}

/// Rust内部で使用するファイル情報
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FileInfoOs {
    pub name: OsString,

    pub metadata: Option<FileMetadata>,
    pub metadata_error: Option<String>,
}
impl FileInfoOs {
    pub fn to_ui(&self) -> FileInfo {
        FileInfo {
            name: self.name.to_string_lossy().to_string(),
            metadata: self.metadata.clone(),
        }
    }
}

/// ファイル検索結果
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileSearchResult {
    pub index: u32,        // ファイルのインデックス
    pub name: String,      // ファイル名
    pub match_str: String, // ファイル名の中のマッチした部分
}
impl FileSearchResult {
    pub fn new(index: usize, name: &str, start: usize, end: usize) -> Self {
        FileSearchResult {
            index: index as u32,
            name: name.to_string(),
            match_str: name.get(start..end).unwrap_or("").to_string(),
        }
    }
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
