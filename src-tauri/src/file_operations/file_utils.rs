//! ファイル操作ライブラリ

use std::{
    ffi::OsStr,
    fs::{self, File},
    path::Path,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};

use crate::{
    file_operations::{
        file_sort::{cmp_file, mk_filename_cmp},
        sjis_cnv::SJIS_CACHE,
    },
    state::app_state::AppState,
    types::{Either, FileInfoOS, FileMetadata, SortCondition},
};

/// ディレクトリを指定してファイル一覧を取得
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

/// ファイルのメタデータを取得
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

/// ファイル日付を更新
pub fn touch_file(file: impl AsRef<Path>) -> anyhow::Result<()> {
    let f = File::options().write(true).open(file)?;
    f.set_modified(SystemTime::now())?;
    Ok(())
}

/// ファイル一覧を名前でソート (アプリ設定を見て)
pub fn sort_by_name(state: &AppState, list: &mut [FileInfoOS]) {
    let cmp = mk_filename_cmp(state);
    let cmp_by_digit = state.preferences.read().unwrap().filename_cmp_by_digit;
    let sort = SortCondition {
        sort_type: crate::types::SortType::Name,
        asc: true,
    };
    let mut sjis_cache = SJIS_CACHE.lock().unwrap();
    list.sort_by(|a, b| cmp_file(a, b, &sort, cmp.as_ref(), &mut sjis_cache, cmp_by_digit));
}

fn to_unix_time(t: Result<SystemTime, std::io::Error>) -> Option<u64> {
    t.ok().and_then(|t| {
        let t = t.duration_since(UNIX_EPOCH);
        t.ok().map(|t| t.as_secs())
    })
}
