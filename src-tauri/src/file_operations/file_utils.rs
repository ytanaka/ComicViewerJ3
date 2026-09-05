use std::{ffi::OsStr, fs, path::Path, sync::Arc};

use crate::{
    types::{Either, FileInfoOS, FileMetadata},
    util::to_unix_time,
};

pub fn read_dir(path: impl AsRef<Path>) -> anyhow::Result<Vec<FileInfoOS>> {
    let mut ret = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let info = FileInfoOS {
            name: Arc::from(entry.file_name()),
            is_dir: entry.file_type()?.is_dir(),
            metadata: None,
        };
        ret.push(info);
    }
    Ok(ret)
}

pub fn read_metadata(dir: impl AsRef<Path>, filename: &OsStr) -> Either<String, FileMetadata> {
    match dir.as_ref().join(filename).metadata() {
        Err(err) => Either::Left(err.to_string()),
        Ok(metadata) => Either::Right(FileMetadata {
            size: if metadata.is_dir() {
                None
            } else {
                Some(metadata.len())
            },
            created: to_unix_time(metadata.created()),
            modified: to_unix_time(metadata.modified()),
            accessed: to_unix_time(metadata.accessed()),
        }),
    }
}
