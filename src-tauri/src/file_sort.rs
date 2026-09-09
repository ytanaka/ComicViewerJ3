use std::{cmp::Ordering, path::Path};

use icu_collator::CollatorBorrowed;

use crate::types::{FileInfoOS, SortCondition, SortType};

pub fn cmp_file(
    f1: &FileInfoOS,
    f2: &FileInfoOS,
    sort: &SortCondition,
    collator: &Option<CollatorBorrowed>,
) -> Ordering {
    // ディレクトリとファイルを比較する場合
    let cmp = match (f1.is_dir, f2.is_dir) {
        (true, false) => Ordering::Less,
        (false, true) => Ordering::Greater,
        _ => Ordering::Equal,
    };
    let cmp = if sort.asc { cmp } else { cmp.reverse() };
    if cmp.is_ne() {
        return cmp;
    };

    // ファイル同士 or ディレクトリ同士
    let cmp = match sort.sort_type {
        SortType::Name => match collator {
            Some(c) => c.compare(&f1.name.to_string_lossy(), &f2.name.to_string_lossy()),
            None => f1.name.cmp(&f2.name),
        },
        SortType::Ext => {
            let ext1 = Path::new(&f1.name).extension().unwrap_or_default();
            let ext2 = Path::new(&f2.name).extension().unwrap_or_default();
            ext1.cmp(ext2)
        }
        SortType::Size => {
            let s1 = f1.get_size().unwrap_or(0);
            let s2 = f2.get_size().unwrap_or(0);
            s1.cmp(&s2)
        }
        SortType::Time => {
            let t1 = f1.get_modified().unwrap_or(0);
            let t2 = f2.get_modified().unwrap_or(0);
            t1.cmp(&t2)
        }
    };
    if sort.asc {
        cmp
    } else {
        cmp.reverse()
    }
}
