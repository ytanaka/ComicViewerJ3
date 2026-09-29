//! アプリ内部のクリップボード管理ライブラリ

use std::path::PathBuf;

/// アプリ内で Ctrl+X, Ctrl+C されたときの情報を保存する
///
/// ※ システムのクリップボードに保存した情報だと、CutかCopyか判別できないので
pub struct AppClipboard {
    pub mode: CutOrCopy,
    pub paths: Vec<PathBuf>,
}
impl AppClipboard {
    pub fn new(mode: CutOrCopy, paths: Vec<PathBuf>) -> Self {
        Self { mode, paths }
    }
    pub fn equal_paths(&self, other: &[PathBuf]) -> bool {
        for p in &self.paths {
            if !other.contains(p) {
                return false;
            }
        }
        true
    }
}
#[derive(Debug, Clone, Copy)]
pub enum CutOrCopy {
    Cut,
    Copy,
}
