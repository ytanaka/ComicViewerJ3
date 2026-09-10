use std::{cmp::Ordering, ffi::OsStr, path::Path, sync::MutexGuard};

use icu::locale::locale;
use icu_collator::{options::CollatorOptions, Collator, CollatorBorrowed};

use crate::{
    file_operations::sjis_cnv::SjisCache,
    state::app_state::AppState,
    types::{FileInfoOS, FilenameCmpType, SortCondition, SortType},
};

// ---------------------------------------------------------------------------------------------------------------------

pub fn cmp_file(
    f1: &FileInfoOS,
    f2: &FileInfoOS,
    sort: &SortCondition,
    filname_cmp: &Box<dyn FilenameCmp>,
    supplement: &mut FilenameCmpSupplement,
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
        SortType::Name => filname_cmp.cmp(&f1.name, &f2.name, supplement),
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
    fn cmp(&self, f1: &OsStr, f2: &OsStr, supplement: &mut FilenameCmpSupplement) -> Ordering;
}

pub fn mk_filename_cmp(state: &AppState) -> Box<dyn FilenameCmp> {
    let pref = state.preferences.get().unwrap().read().unwrap();
    match pref.filename_cmp {
        FilenameCmpType::Unicode => Box::new(UnicodeFilenameCmp {}),
        FilenameCmpType::Sjis => Box::new(SjisFilenameCmp {}),
        FilenameCmpType::Icu => Box::new(IcuFilenameCmp::new(state)),
    }
}
pub struct FilenameCmpSupplement<'a> {
    pub cache: MutexGuard<'a, SjisCache>,
}
impl<'a> FilenameCmpSupplement<'a> {
    pub fn new(cache: MutexGuard<'a, SjisCache>) -> Self {
        FilenameCmpSupplement { cache }
    }
}

// ---------------------------------------------------------------------------------------------------------------------
struct UnicodeFilenameCmp {}
impl FilenameCmp for UnicodeFilenameCmp {
    fn cmp(&self, f1: &OsStr, f2: &OsStr, _: &mut FilenameCmpSupplement) -> Ordering {
        f1.cmp(f2)
    }
}

// ---------------------------------------------------------------------------------------------------------------------
struct SjisFilenameCmp {}
impl FilenameCmp for SjisFilenameCmp {
    fn cmp(&self, f1: &OsStr, f2: &OsStr, supplement: &mut FilenameCmpSupplement) -> Ordering {
        let s1 = f1.to_string_lossy();
        let s2 = f2.to_string_lossy();

        let mut chars1 = s1.chars();
        let mut chars2 = s2.chars();

        loop {
            // ファイル名の先頭から１文字ずつ順番に比較する
            match (chars1.next(), chars2.next()) {
                // to_string_lossy() が最後まで同じ文字列になったら OsStr で比較
                (None, None) => return f1.cmp(f2),
                // f1 が短い
                (None, Some(_)) => return Ordering::Less,
                // f1 が長い
                (Some(_), None) => return Ordering::Greater,
                // 1文字をSJISに変換して比較
                (Some(c1), Some(c2)) => {
                    let ord = match (supplement.cache.get(c1), supplement.cache.get(c1)) {
                        // 両方SJISに変換可能な場合
                        (Some(c1), Some(c2)) => c1.cmp(&c2),
                        // SJIS文字 < 非SJIS文字 にする
                        (Some(_), None) => Ordering::Less,
                        (None, Some(_)) => Ordering::Greater,
                        // 両方SJISにできないなら、Unicode比較
                        (None, None) => c1.cmp(&c2),
                    };
                    if ord != Ordering::Equal {
                        return ord;
                    }
                }
            }
        }
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
    fn cmp(&self, f1: &OsStr, f2: &OsStr, _: &mut FilenameCmpSupplement) -> Ordering {
        match &self.collator {
            Some(c) => c.compare(&f1.to_string_lossy(), &f2.to_string_lossy()),
            None => f1.cmp(f2),
        }
    }
}

// =============================================================================================
//
// #####################   #####################      ###############      #####################
// #####################   #####################      ###############      #####################
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###                              ###
//          ###            ###                     ###                              ###
//          ###            ###############            ###############               ###
//          ###            ###############            ###############               ###
//          ###            ###                                       ###            ###
//          ###            ###                                       ###            ###
//          ###            ###                     ###               ###            ###
//          ###            ###                     ###               ###            ###
//          ###            #####################      ###############               ###
//          ###            #####################      ###############               ###
//
// =============================================================================================

#[cfg(test)]
mod tests {

    use std::{
        cmp::Ordering::{Equal, Greater, Less},
        sync::Arc,
    };

    use crate::file_operations::sjis_cnv::SJIS_CACHE;

    use super::*;

    #[test]
    fn test_sjis() {
        let cmp: Box<dyn FilenameCmp> = Box::new(SjisFilenameCmp {});
        let mut supp = FilenameCmpSupplement::new(SJIS_CACHE.lock().unwrap());
        let cond = SortCondition {
            sort_type: SortType::Name,
            asc: true,
        };
        let mut test = |f1: &str, f2: &str, expect: Ordering| {
            let f1 = FileInfoOS {
                name: Arc::from(OsStr::new(f1)),
                is_dir: false,
                metadata: None,
            };
            let f2 = FileInfoOS {
                name: Arc::from(OsStr::new(f2)),
                is_dir: false,
                metadata: None,
            };
            let ret = cmp_file(&f1, &f2, &cond, &cmp, &mut supp);
            assert_eq!(
                ret,
                expect,
                "{}",
                format!("{:?} cmp {:?}", f1.name, f2.name)
            );
        };

        assert_eq!("a".cmp("b"), Less);
        assert_eq!("123".cmp("1234"), Less);

        test("a", "a", Equal);
        test("a", "b", Less);
        test("b", "a", Greater);

        test("12345", "123456", Less);
    }
}
