use std::{ffi::OsStr, path::Path};

use crate::{
    types::{Either, FileMetadata},
    util::to_unix_time,
};

pub fn read_metadata(dir: impl AsRef<Path>, filename: &OsStr) -> Either<FileMetadata, String> {
    match dir.as_ref().join(filename).metadata() {
        Err(err) => Either::Right(err.to_string()),
        Ok(metadata) => Either::Left(FileMetadata {
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
