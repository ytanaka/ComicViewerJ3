use std::path::{Path, PathBuf};

use crate::types::TaskId;

/// ファイルを Ctrl+V
pub fn move_paths(task_id: TaskId, froms: &[PathBuf], to: impl AsRef<Path>) -> anyhow::Result<()> {
    todo!()
}
