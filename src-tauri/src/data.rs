use std::path::PathBuf;

use serde::Serialize;

#[derive(Debug, Serialize, Default, Clone)]
pub struct DirEntry {
    pub id: u64,
    pub name: String,
}

#[derive(Debug, Serialize, Default, Clone)]
pub struct FileInfo {
    pub id: u64,
    pub path: PathBuf,
    pub metadata: Option<FileMetadata>,
}

#[derive(Debug, Serialize, Default, Clone)]
pub struct FileMetadata {
    pub is_dir: bool,
    pub size: Option<u64>,
    pub modified: Option<u64>,
    pub accessed: Option<u64>,
    pub created: Option<u64>,
}
