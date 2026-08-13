use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use specta::Type;

// u64 は JS の number に完全に変換できないが、53bitまでの値なら大丈夫
// ファイルid、ファイルサイズ、更新日時は 53bit 以内になるはず
// Rust の u64 を JS の number にするために、specta_typescript::Number を指定する (tauri_specta でエラーになる)

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DirEntry {
    #[specta(type = specta_typescript::Number)]
    pub id: u64,

    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileInfo {
    #[specta(type = specta_typescript::Number)]
    pub id: u64,

    pub path: PathBuf,
    pub metadata: Option<FileMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
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
