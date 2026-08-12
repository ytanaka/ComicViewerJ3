use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use specta::Type;

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

// #[derive(Debug, Clone, Serialize, Deserialize, Type)]
// pub struct TsU64 {
//     // u64 はJS側で必ず number になってしまう。
//     // ※ TSの型指定で string や bigint にしても、実体は number になる。
//     // とりあえず number でも 53bit までは正確に扱えるので
//     #[specta(type = specta_typescript::Number)]
//     pub i: u64,
// }

// impl From<u64> for TsU64 {
//     fn from(i: u64) -> Self {
//         TsU64 { i }
//     }
// }
