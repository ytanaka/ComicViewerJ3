use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

use encoding_rs::EUC_JP;
use wana_kana::utils::hiragana_to_katakana;

use crate::{
    text_search::util::{is_ascii, is_katakana},
    UT_LOG,
};

// migemo辞書は 読み => 漢字 になっているが、逆転させて 漢字 => 読み の辞書を作る
/*
migemo-dict の例

test \t テスト
きき \t 機器 \t 危機 \t 器機 \t 嬉々
...
 */

pub struct ReverseMigemo {
    // 英単語 -> カタカナ読み
    // 漢字 -> カタカナ読み
    map: HashMap<String, HashSet<Arc<[char]>>>,

    empty: HashSet<Arc<[char]>>,
}

impl ReverseMigemo {
    pub fn new() -> Arc<Self> {
        let (cow, _, _) = EUC_JP.decode(include_bytes!("../../dict/migemo-0.40/migemo-dict"));
        Arc::new(Self::with_dict(&cow))
    }
    pub fn with_dict(dict: &str) -> Self {
        let mut map = HashMap::<String, HashSet<Arc<[char]>>>::new();
        let mut map_insert = |k: &str, v: &str| {
            if k.is_empty() || v.is_empty() {
                return;
            }
            let elem = map.entry(k.to_string()).or_default();
            elem.insert(v.chars().collect());
        };

        // migemo 辞書を読む
        for line in dict
            .lines()
            .map(|s| s.trim())
            .filter(|s| !s.starts_with(";;"))
        {
            let mut ite = line.split("\t").into_iter();
            if let Some(head) = ite.next() {
                UT_LOG!("head: {}", head);
                if is_ascii(head) {
                    // 先頭が英単語の場合、(英単語 \t カタカナ読み) => map(英単語, カタカナ読み)
                    for i in ite.map(|s| hiragana_to_katakana(s)) {
                        if is_katakana(&i) {
                            UT_LOG!("  英:{}->{}", head, i);
                            map_insert(head, &i);
                        }
                    }
                } else {
                    // 先頭が英単語でない場合、(ひらがな読み \t 漢字 ...) => map(漢字, カタカナ読み)
                    let head = hiragana_to_katakana(head);
                    for i in ite {
                        UT_LOG!("  漢:{}->{}", i, &head);
                        map_insert(i, &head);
                    }
                }
            }
        }
        ReverseMigemo {
            map,
            empty: HashSet::new(),
        }
    }

    pub fn get_yomi(&self, k: &str) -> &HashSet<Arc<[char]>> {
        self.map.get(k).unwrap_or(&self.empty)
    }
}

// =================================================================================================
// =================================================================================================
// =================================================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn v<I, S>(iter: I) -> Vec<String>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut vec: Vec<String> = vec![];
        for s in iter {
            vec.push(s.as_ref().to_string());
        }
        vec.sort();
        vec
    }
    impl ReverseMigemo {
        fn get_yomi_str(&self, k: &str) -> HashSet<String> {
            let ret = self
                .get_yomi(k)
                .iter()
                .map(|s| {
                    let x = s.iter().collect();
                    x
                })
                .collect();

            ret
        }
    }

    #[test]
    fn test_with_dic() {
        let dict = "
            ;; コメント
            test\tてすと\tテッスート
            tes\tてす
            t
            れい\t例\t礼\t令
            あ
            ;; コメント";

        let r = ReverseMigemo::with_dict(dict);

        assert_eq!(v(r.map.keys()), v(&["test", "tes", "令", "例", "礼"]));

        assert_eq!(v(r.get_yomi_str("test")), v(&["テスト", "テッスート"]));
        assert_eq!(v(r.get_yomi_str("tes")), v(&["テス"]));
        assert_eq!(v(r.get_yomi_str("令")), v(&["レイ"]));
        assert_eq!(v(r.get_yomi_str("礼")), v(&["レイ"]));
        assert_eq!(v(r.get_yomi_str("例")), v(&["レイ"]));

        assert!(r.get_yomi("t").is_empty());
        assert!(r.get_yomi("xxx").is_empty());
    }
}
