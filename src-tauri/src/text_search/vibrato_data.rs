use std::{collections::HashSet, sync::Arc};

use crate::{text_search::reverse_migemo::ReverseMigemo, UT_LOG};

/// 形態素解析した結果の単語で区切られた文字列を格納する
/// vec['タンゴ', 'ノ', 'クギリ', 'デス']
pub struct SplStr {
    // 単語区切りされた文字列リスト
    list: Vec<SplStrElm>,

    // 正規化した文字列 (ひらがな -> カタカナ、英数 -> 半角 など)
    // ※ 形態素解析以外の普通の文字列検索で使用する
    normalized: String,

    // ただの参照
    reverse_migemo: Arc<ReverseMigemo>,
}

/// 形態素解析した結果の単語１つ
pub struct SplStrElm {
    // オリジナル文字列
    org_str: String,

    // カタカナ読み
    // 検索の都合上、char で保管する
    yomi: Arc<[char]>,
}
impl SplStrElm {
    pub fn new(org_str: &str, yomi: &str) -> Self {
        SplStrElm {
            org_str: org_str.to_string(),
            yomi: yomi.chars().collect(),
        }
    }
}

impl SplStr {
    pub fn new(normalized: &str, list: Vec<SplStrElm>, reverse_migemo: Arc<ReverseMigemo>) -> Self {
        SplStr {
            list,
            normalized: normalized.to_string(),
            reverse_migemo,
        }
    }

    pub fn get_normalized_str(&self) -> &str {
        &self.normalized
    }

    pub fn get_org_str_vec(&self) -> Vec<&String> {
        self.list.iter().map(|i| &i.org_str).collect()
    }

    pub fn get_org_str(&self) -> String {
        self.get_org_str_vec()
            .iter()
            .map(|s| s.as_ref())
            .collect::<Vec<_>>()
            .join("")
    }

    // 読み候補を全て取得する (Migemo辞書も使用する)
    fn get_yomi(&self, i: usize) -> HashSet<Arc<[char]>> {
        let mut ret = HashSet::new();

        // 形態素解析の読み
        ret.insert(self.list[i].yomi.clone());

        // オリジナル文字列の読みをMigemo辞書から取得する
        ret.extend(
            self.reverse_migemo
                .get_yomi(&self.list[i].org_str)
                .iter()
                .cloned(),
        );

        ret
    }

    // 単語区切り中の何番目から何番目に一致したかを返す
    // ※) カタカナ読みで一致せるので、オリジナル文字列のどの文字に一致したかはわからない。
    //     単語区切り単位でしか位置を返せない
    // ※) 1つの単語内部で一致したら、同じインデックスを返す
    //
    // "DE" を探す場合の処理例
    // AB/CD/EF の中から検索する場合
    //   ,  ,   find() はAB, CD, EF の順に処理する (ループ)
    // ^ ,  ,   slip_find_at_list_idx(AB, "DE") を呼んで先頭文字から順番に検索する (ループ)
    // x ,  ,   一致しない
    //  x,  ,   一致しない (find() に戻る)
    //   ,^ ,   slip_find_at_list_idx(CD, "DE") を呼んで先頭文字から順番に検索する (ループ)
    //   ,x ,   一致しない
    //   , o,   "D" が一致した (CD の末尾まで一致した)
    //   ,  ,^  find_from_list_idx(EF, "E") を呼んで要素単位で検索する (再帰)
    //   ,  ,o  "E" が一致した (検索文字の最後まで一致した)
    //          先頭がインデックス 1、末尾が 2 で一致したので、戻り値は Some(1,2) になる
    //          ※ "DE" を検索して "AB/CD" と一致したと解釈する
    pub fn find(&self, katakana: &str) -> Option<(usize, usize)> {
        UT_LOG!("\nfind({})", katakana);

        let katakana: Vec<char> = katakana.chars().collect();
        let katakana = katakana.as_slice();

        // 先頭要素から順番に一致するか試す
        for i in 0..self.list.len() {
            if let Some(x) = self.slip_find_at_list_idx(i, katakana) {
                return Some((i, x));
            }
        }
        None
    }
    // 指定された要素を先頭にして一致するか検索する（先頭要素は１文字づつずらしながら検索する）
    // 一致した末尾のインデックスを返す
    fn slip_find_at_list_idx(&self, start_idx: usize, katakana: &[char]) -> Option<usize> {
        // Migemo辞書で読みの複数候補があるのでここで繰り返す
        self.get_yomi(start_idx)
            .iter()
            .find_map(|yomi| self.slip_find_at_list_idx2(start_idx, yomi, katakana))
    }
    fn slip_find_at_list_idx2(
        &self,
        start_idx: usize,
        yomi: &[char],
        katakana: &[char],
    ) -> Option<usize> {
        // 指定された要素の先頭文字から1文字づつずらしながら一致するか試す
        for char_idx in 0..yomi.len() {
            let slip_head = &yomi[char_idx..];
            UT_LOG!("st:{} ch:{}, head:{:?}", start_idx, char_idx, slip_head);
            match starts_with(slip_head, katakana) {
                None => continue, // 一致しなかったら、次の文字から試す
                Some(n) => {
                    UT_LOG!("  matched chars:{}", n);
                    let katakana2 = &katakana[n..];
                    if katakana2.is_empty() {
                        // 全部一致していたら検索成功
                        return Some(start_idx);
                    }
                    // 一致の残りがあったら、次の要素を検索する
                    if start_idx + 1 < self.list.len() {
                        return self.find_from_list_idx(start_idx + 1, katakana2);
                    }
                }
            }
        }
        None
    }
    // 指定された要素を先頭にして一致するか検索する
    // 一致した末尾のインデックスを返す
    fn find_from_list_idx(&self, start_idx: usize, katakana: &[char]) -> Option<usize> {
        // Migemo辞書で読みの複数候補があるのでここで繰り返す
        self.get_yomi(start_idx)
            .iter()
            .find_map(|yomi| self.find_from_list_idx2(start_idx, yomi, katakana))
    }
    fn find_from_list_idx2(
        &self,
        start_idx: usize,
        yomi: &[char],
        katakana: &[char],
    ) -> Option<usize> {
        UT_LOG!("    find list:{} {:?}", start_idx, katakana);
        match starts_with(yomi, katakana) {
            None => None,
            Some(n) => {
                let katakana2 = &katakana[n..];
                if katakana2.is_empty() {
                    // 全部一致していたら検索成功
                    return Some(start_idx);
                }
                if self.list.len() <= start_idx + 1 {
                    // 末尾まで来たのに検索文字列が残っていた
                    return None;
                }
                // 一致の残りがあったら、次の要素を検索する
                self.find_from_list_idx(start_idx + 1, katakana2)
            }
        }
    }

    // find() で返された要素のインデックスをStringのインデックスに変換する
    pub fn elmidx_to_stridx(&self, elmidx: (usize, usize)) -> (usize, usize) {
        UT_LOG!("elmidx_to_stridx({elmidx:?})");
        let mut start: Option<usize> = None;
        let mut end: Option<usize> = None;
        let mut n = 0;
        for (i, s) in self.get_org_str_vec().iter().enumerate() {
            UT_LOG!("i: {i}, s: {s}");
            if start.is_none() && elmidx.0 <= i {
                start = Some(n);
            }
            n += s.len();
            if end.is_none() && elmidx.1 <= i {
                end = Some(n);
            }
            if let (Some(s), Some(e)) = (start, end) {
                return (s, e);
            }
        }
        (0, n)
    }
}

// [char].starts_with と同じだが、target よりも str が長くても一致する
// 一致した文字数を返す
fn starts_with(target: &[char], str: &[char]) -> Option<usize> {
    let min = target.len().min(str.len());
    if min == 0 {
        return None;
    }
    if !target.starts_with(&str[0..min]) {
        // 不一致部分があった
        return None;
    }
    if str.len() <= target.len() {
        // 完全に含まれていた
        Some(str.len())
    } else {
        // 検索文字列の先頭部分が一致 （全部一致しなくてもいい）
        Some(target.len())
    }
}

// =================================================================================================
// =================================================================================================
// =================================================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn v(s: &str) -> Vec<char> {
        s.chars().collect()
    }

    #[test]
    fn test_starts_with() {
        let s = &v("あいうえお");
        assert_eq!(starts_with(s, &v("あいう")), Some(3));
        assert_eq!(starts_with(s, &v("あいうえお")), Some(5));
        assert_eq!(starts_with(s, &v("あいうえおかき")), Some(5));
        assert_eq!(starts_with(s, &v("いうえ")), None);
        assert_eq!(starts_with(s, &v("うえお")), None);
        assert_eq!(starts_with(s, &v("うえお")), None);
        assert_eq!(starts_with(s, &v("えおか")), None);
        assert_eq!(starts_with(s, &v("あ")), Some(1));
        assert_eq!(starts_with(s, &v("")), None);
        assert_eq!(starts_with(s, &v("ん")), None);

        let s = v("a");
        assert_eq!(starts_with(&s, &v("abc")), Some(1));

        let s = v("");
        assert_eq!(starts_with(&s, &v("a")), None);
        assert_eq!(starts_with(&s, &v("")), None);
    }

    fn vv(list: &[&str]) -> Vec<SplStrElm> {
        list.iter()
            .map(|i| SplStrElm::new("亜以宇江尾", i))
            .collect()
    }

    #[test]
    fn test_spl_str_find_empty_reverse_migemo() {
        fn splstr_new(list: Vec<SplStrElm>) -> SplStr {
            let empty_reverse_migemo = Arc::new(ReverseMigemo::with_dict(""));
            SplStr::new("", list, empty_reverse_migemo)
        }
        let s = splstr_new(vv(&["あいうえお", "かきくけこ", "さしすせそ"]));
        assert_eq!(s.find("あ"), Some((0, 0)));
        assert_eq!(s.find("い"), Some((0, 0)));
        assert_eq!(s.find("あいう"), Some((0, 0)));
        assert_eq!(s.find("あいうえお"), Some((0, 0)));
        assert_eq!(s.find("うえお"), Some((0, 0)));
        assert_eq!(s.find("お"), Some((0, 0)));

        assert_eq!(s.find("か"), Some((1, 1)));
        assert_eq!(s.find("き"), Some((1, 1)));
        assert_eq!(s.find("かきく"), Some((1, 1)));
        assert_eq!(s.find("かきくけこ"), Some((1, 1)));
        assert_eq!(s.find("くけこ"), Some((1, 1)));
        assert_eq!(s.find("こ"), Some((1, 1)));

        assert_eq!(s.find("さ"), Some((2, 2)));
        assert_eq!(s.find("そ"), Some((2, 2)));

        assert_eq!(s.find("あいうえおかきく"), Some((0, 1)));
        assert_eq!(s.find("あいうえおかきくけこ"), Some((0, 1)));
        assert_eq!(s.find("あいうえおかきくけこさしすせそ"), Some((0, 2)));
        assert_eq!(s.find("あいうえおかきくけこさしすせそあ"), None);
        assert_eq!(s.find("うえおかきくけこさしすせそ"), Some((0, 2)));
        assert_eq!(s.find("くけこさしすせそ"), Some((1, 2)));

        assert_eq!(s.find(""), None);
        assert_eq!(s.find("ん"), None);

        let s = splstr_new(vv(&["abcdef"]));
        assert_eq!(s.find("a"), Some((0, 0)));
        assert_eq!(s.find("f"), Some((0, 0)));
        assert_eq!(s.find("abcdef"), Some((0, 0)));
        assert_eq!(s.find("bcde"), Some((0, 0)));
        assert_eq!(s.find("A"), None);

        let s = splstr_new(vv(&[""]));
        assert_eq!(s.find("a"), None);
        assert_eq!(s.find(""), None);

        let s = splstr_new(vv(&["a", "b", "c"]));
        assert_eq!(s.find("ab"), Some((0, 1)));
        assert_eq!(s.find("bc"), Some((1, 2)));
        assert_eq!(s.find("ac"), None);
        assert_eq!(s.find("a"), Some((0, 0)));
        assert_eq!(s.find("b"), Some((1, 1)));
        assert_eq!(s.find("c"), Some((2, 2)));
        assert_eq!(s.find(""), None);

        let s = splstr_new(vv(&["a", "", "b"]));
        assert_eq!(s.find("ab"), None);
        assert_eq!(s.find(""), None);
    }

    #[test]
    fn test_spl_str_find() {
        let migemo_dict = "
            ふう\t風
            たに\t谷
            や\t谷
            こく\t谷
            ";
        let reverse_migemo = Arc::new(ReverseMigemo::with_dict(migemo_dict));
        let s = SplStr::new(
            "",
            vec![
                SplStrElm::new("風", "カゼ"),
                SplStrElm::new("の", "ノ"),
                SplStrElm::new("谷", "タニ"),
                SplStrElm::new("の", "ノ"),
                SplStrElm::new("ナウシカ", "ナウシカ"),
            ],
            reverse_migemo,
        );
        assert_eq!(s.find("カゼノタニノナウシカ"), Some((0, 4)));
        assert_eq!(s.find("ゼノタ"), Some((0, 2)));
        assert_eq!(s.find("フウノ"), Some((0, 1)));
        assert_eq!(s.find("フウノコクノナウシカ"), Some((0, 4)));
        assert_eq!(s.find("ウノコクノナウシ"), Some((0, 4)));
    }

    #[test]
    fn test_elmidx_to_stridx() {
        let empty_reverse_migemo = Arc::new(ReverseMigemo::with_dict(""));
        let s = SplStr::new(
            "",
            vec![
                SplStrElm::new("0123", ""),
                SplStrElm::new("45", ""),
                SplStrElm::new("67890", ""),
            ],
            empty_reverse_migemo.clone(),
        );
        // 正常範囲
        assert_eq!(s.elmidx_to_stridx((0, 0)), (0, 4));
        assert_eq!(s.elmidx_to_stridx((1, 1)), (4, 6));
        assert_eq!(s.elmidx_to_stridx((2, 2)), (6, 11));
        assert_eq!(s.elmidx_to_stridx((0, 2)), (0, 11));
        // 異常範囲
        assert_eq!(s.elmidx_to_stridx((0, 9)), (0, 11));
        assert_eq!(s.elmidx_to_stridx((9, 9)), (0, 11));
        assert_eq!(s.elmidx_to_stridx((9, 0)), (0, 11));
        assert_eq!(s.elmidx_to_stridx((3, 1)), (0, 11));

        let s = SplStr::new(
            "",
            vec![
                SplStrElm::new("あいうえお", ""), // 0 から 15 バイト
                SplStrElm::new("かき", ""),       // 15 から 6 バイト
                SplStrElm::new("くけこ", ""),     // 21 から 9 バイト
            ],
            empty_reverse_migemo.clone(),
        );
        assert_eq!(s.elmidx_to_stridx((0, 0)), (0, 15));
        assert_eq!(s.elmidx_to_stridx((1, 1)), (15, 21));
        assert_eq!(s.elmidx_to_stridx((2, 2)), (21, 30));
        assert_eq!(s.elmidx_to_stridx((0, 2)), (0, 30));
    }
}
