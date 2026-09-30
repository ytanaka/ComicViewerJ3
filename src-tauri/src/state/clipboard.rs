//! アプリ内部のクリップボード管理ライブラリ

use std::path::PathBuf;

use crate::types::MoveOrCopy;

/// アプリ内で Ctrl+X, Ctrl+C されたときの情報を保存する
///
/// ※ システムのクリップボードに保存した情報だと、CutかCopyか判別できないので
pub struct AppClipboard {
    pub mode: MoveOrCopy,
    pub paths: Vec<PathBuf>,
}
impl AppClipboard {
    pub fn new(mode: MoveOrCopy, paths: Vec<PathBuf>) -> Self {
        Self { mode, paths }
    }
    pub fn equal_paths(&self, other: &[PathBuf]) -> bool {
        if self.paths.len() != other.len() {
            return false;
        }
        for (p1, p2) in self.paths.iter().zip(other) {
            if p1 != p2 {
                return false;
            }
        }
        true
    }
}
