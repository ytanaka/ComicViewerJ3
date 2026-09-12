use std::{
    ffi::OsStr,
    fs::{self, File},
    path::Path,
    sync::Arc,
    time::SystemTime,
};

use crate::{
    types::{Either, FileInfoOS, FileMetadata},
    util::to_unix_time,
};

pub fn read_dir(path: impl AsRef<Path>) -> anyhow::Result<Vec<FileInfoOS>> {
    let mut ret = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let is_symlink = entry.file_type()?.is_symlink();

        let info = FileInfoOS {
            name: Arc::from(entry.file_name()),
            is_symlink,
            is_dir: if is_symlink {
                entry.path().is_dir() // シンボリックリンクの先を調べる
            } else {
                entry.file_type()?.is_dir()
            },
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

pub fn touch_file(file: impl AsRef<Path>) -> anyhow::Result<()> {
    let f = File::options().write(true).open(file)?;
    f.set_modified(SystemTime::now())?;
    Ok(())
}
