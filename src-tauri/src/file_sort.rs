use std::{cmp::Ordering, ffi::OsStr, path::Path};

use icu::locale::locale;
use icu_collator::{options::CollatorOptions, Collator, CollatorBorrowed};

use crate::{
    state::app_state::AppState,
    types::{FileInfoOS, FilenameCmpType, SortCondition, SortType},
};

// ---------------------------------------------------------------------------------------------------------------------

pub fn cmp_file(
    f1: &FileInfoOS,
    f2: &FileInfoOS,
    sort: &SortCondition,
    filname_cmp: &Box<dyn FilenameCmp>,
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
        SortType::Name => filname_cmp.cmp(&f1.name, &f2.name),
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

// ---------------------------------------------------------------------------------------------------------------------

pub trait FilenameCmp {
    fn cmp(&self, f1: &OsStr, f2: &OsStr) -> Ordering;
}

pub fn mk_filename_cmp(state: &AppState) -> Box<dyn FilenameCmp> {
    let pref = state.preferences.get().unwrap().read().unwrap();
    match pref.filename_cmp {
        FilenameCmpType::Unicode => Box::new(UnicodeFilenameCmp {}),
        FilenameCmpType::Sjis => Box::new(SjisFilenameCmp {}),
        FilenameCmpType::Icu => Box::new(IcuFilenameCmp::new(state)),
    }
}

// ---------------------------------------------------------------------------------------------------------------------
struct UnicodeFilenameCmp {}
impl FilenameCmp for UnicodeFilenameCmp {
    fn cmp(&self, f1: &OsStr, f2: &OsStr) -> Ordering {
        f1.cmp(f2)
    }
}

// ---------------------------------------------------------------------------------------------------------------------
struct SjisFilenameCmp {}
impl FilenameCmp for SjisFilenameCmp {
    fn cmp(&self, f1: &OsStr, f2: &OsStr) -> Ordering {
        // TODO
        f1.cmp(f2)
    }
}

// ---------------------------------------------------------------------------------------------------------------------
struct IcuFilenameCmp {
    collator: Option<CollatorBorrowed<'static>>,
}
impl IcuFilenameCmp {
    pub fn new(state: &AppState) -> Self {
        let mut options = CollatorOptions::default();
        options.strength = Some(state.preferences.read().unwrap().get_collator_options());
        let collator = Collator::try_new(locale!("ja").into(), options).ok();
        IcuFilenameCmp { collator }
    }
}
impl FilenameCmp for IcuFilenameCmp {
    fn cmp(&self, f1: &OsStr, f2: &OsStr) -> Ordering {
        match &self.collator {
            Some(c) => c.compare(&f1.to_string_lossy(), &f2.to_string_lossy()),
            None => f1.cmp(f2),
        }
    }
}
