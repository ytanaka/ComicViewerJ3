use regex::Regex;

use rustmigemo::migemo::query::query;
use rustmigemo::migemo::{self, compact_dictionary::CompactDictionary};

// https://github.com/oguna/rustmigemo
pub struct Migemo {
    dict: CompactDictionary,
}
impl Migemo {
    pub fn new() -> Self {
        // let dict_file = &include_bytes!("../dict/migemo-compact-dict").to_vec();
        let dict_file =
            &include_bytes!("../../dict/migemo-compact-dict/migemo-compact-dict").to_vec();
        let dict = migemo::compact_dictionary::CompactDictionary::new(dict_file);
        Migemo { dict }
    }

    pub fn get_query_regex(&self, str: &str) -> Regex {
        let q = query(
            str.to_string(),
            &self.dict,
            &migemo::regex_generator::RegexOperator::Default,
        );
        let re = Regex::new(&q).unwrap();
        re
    }
}
