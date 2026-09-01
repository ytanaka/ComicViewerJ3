use std::{collections::HashMap, sync::Arc};

use crate::UT_LOG;

const AIUEO: &[char] = &['a', 'i', 'u', 'e', 'o'];

const MAX_ROMA_LEN: usize = 4; // 単独のカタカナに変換する最大のローマ字文字数 (ltsu, xtsu とか)

static TBL: &[(&str, &str)] = &[
    ("", "アイウエオ"),
    ("k", "カキクケコ"),
    ("s", "サシスセソ"),
    ("t", "タチツテト"),
    ("n", "ナニヌネノ"),
    ("h", "ハヒフヘホ"),
    ("m", "マミムメモ"),
    ("y", "ヤイユ　ヨ"),
    ("r", "ラリルレロ"),
    ("w", "ワ　　　ヲ"),
    ("g", "ガギグゲゴ"),
    ("z", "ザジズゼゾ"),
    ("d", "ダヂヅデド"),
    ("b", "バビブベボ"),
    ("p", "パピプペポ"),
    ("x", "ァィゥェォ"),
    ("l", "ァィゥェォ"),
    ("ly", "ャィュェョ"),
    ("xy", "ャィュェョ"),
    /* */
    ("ky", "キャキィキュキェキョ"),
    ("sy", "シャシィシュシェショ"),
    ("sh", "シャシ　シュシェショ"),
    ("th", "テャティテュテェテョ"),
    ("ch", "チャチ　チュチェチョ"),
    ("cy", "チャチィチュチェチョ"),
    ("ty", "チャチィチュチェチョ"),
    ("ny", "ニャニィニュニェニョ"),
    ("hy", "ヒャヒィヒュヒェヒョ"),
    ("fy", "フャフィフュフェフョ"),
    ("my", "ミャミィミュミェミョ"),
    ("ry", "リャリィリュリェリョ"),
    /* */
    ("gy", "ギャギィギュギェギョ"),
    ("zy", "ジャジィジュジェジョ"),
    ("j ", "ジャジ　ジュジェジョ"),
    ("jy", "ジャジィジュジェジョ"),
    ("dy", "ヂャヂィヂュヂェヂョ"),
    ("dh", "デャディデュデェデョ"),
    ("by", "ビャビィビュビェビョ"),
    ("py", "ピャピィピュピェピョ"),
    /* */
    ("wh", "ウァウィ　　ウェウォ"),
    ("ts", "ツァツィツ　ツェツォ"),
    ("f ", "ファフィフ　フェフォ"),
    ("v ", "ヴァヴィヴ　ヴェヴォ"),
    /* */
    ("y  ", "　　　　　　イェ　　"),
    ("w  ", "　　ウィ　　ウェ　　"),
    ("lk ", "ヵ　　　　　ヶ　　　"),
    ("xk ", "ヵ　　　　　ヶ　　　"),
    ("kw ", "クァ　　　　　　　　"),
    ("gw ", "グァ　　　　　　　　"),
    ("dw ", "　　　　ドゥ　　　　"),
    ("lt ", "　　　　ッ　　　　　"),
    ("lts", "　　　　ッ　　　　　"),
    ("lw ", "ヮ　　　　　　　　　"),
    ("tw ", "　　　　トゥ　　　　"),
    ("wy ", "　　ヰ　　　ヱ　　　"),
    ("xt ", "　　　　ッ　　　　　"),
    ("xts", "　　　　ッ　　　　　"),
    ("xw ", "ヮ　　　　　　　　　"),
];

pub struct RomajiCnv {
    tbl: HashMap<Vec<char>, Vec<char>>,
}

impl RomajiCnv {
    pub fn new() -> Arc<Self> {
        let mut tbl = HashMap::new();
        let mut add = |k: &str, v: &str| {
            let k: Vec<char> = k.trim().chars().collect();
            let v: Vec<char> = v.trim().trim_matches('　').chars().collect();
            if !k.is_empty() && !v.is_empty() {
                UT_LOG!(
                    "init RomajiCnv: {} -> {}",
                    k.iter().collect::<String>(),
                    v.iter().collect::<String>()
                );
                tbl.insert(k, v);
            }
        };
        let mut add_list = |k: &str, v: &str| {
            for (boin, v) in AIUEO.iter().zip(spl5(v).iter()) {
                add(&format!("{}{}", k.trim(), boin), v);
            }
        };
        fn spl5(s: &str) -> Vec<String> {
            let list: Vec<char> = s.chars().collect();
            assert!(list.len() % 5 == 0);
            let list: Vec<&[char]> = list.chunks(list.len() / 5).collect();
            list.iter().map(|s| s.iter().collect()).collect()
        }
        for (k, v) in TBL {
            add_list(k, v);
        }
        add("nn", "ン");
        add("n'", "ン"); // 修正ヘボン式 "n'a" -> "ナ"

        Arc::new(RomajiCnv { tbl })
    }

    pub fn cnv(&self, romaji: &str) -> String {
        UT_LOG!("\n{}", romaji);
        let romaji: Vec<char> = romaji.to_lowercase().chars().collect();
        let mut i = 0;
        let mut ret = Vec::new();

        'L0: while i < romaji.len() {
            // まずは一覧表を使って変換する
            for len in (1..=MAX_ROMA_LEN).rev() {
                if romaji.len() < i + len {
                    continue;
                }
                match self.tbl.get(&romaji[i..i + len]) {
                    None => continue,
                    Some(kana) => {
                        UT_LOG!("{}: {:?} -> {:?}", i, &romaji[i..i + len], kana);
                        ret.extend(kana);
                        i += len;
                        continue 'L0;
                    }
                }
            }

            let c = romaji[i];

            // "ー"
            if c == '-' {
                ret.push('ー');
                i += 1;
                continue;
            }

            // "ン"
            if c == 'n' {
                // 末尾の "N" は無視
                // ※) 削除しないと、"ホネ" をインクリメンタル検索する途中(honと入力したとき)で、
                //     "hon"(ホン) が出現してしまい、検索結果がおかしくなる場合がある
                if i == romaji.len() - 1 {
                    break;
                }
                // 末尾の "NY" は無視
                if i == romaji.len() - 2 && romaji[romaji.len() - 1] == 'y' {
                    break;
                }
                ret.push('ン');
                i += 1;
                continue;
            }

            // "っっっ…"
            if romaji.len() > i + 1 && romaji[i + 1] == c && c.is_ascii_alphabetic() {
                ret.push('ッ');
                i += 1;
                continue;
            }

            // 無変換
            ret.push(c);
            i += 1;
        }

        // 末尾の未変換アルファベットを削除する
        // "aax" =(変換)=> "アアx" =(削除)=> "アア"
        while ret.len() > 0 {
            if !ret[ret.len() - 1].is_ascii_alphabetic() {
                break;
            }
            ret.pop();
        }

        ret.iter().collect()
    }
}

// =================================================================================================
// =================================================================================================
// =================================================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_starts_with() {
        let romaji = RomajiCnv::new();
        let r = |s: &str| romaji.cnv(s);

        assert_eq!(r("aiueo"), "アイウエオ");
        assert_eq!(r("tesuto"), "テスト");
        assert_eq!(r("tesutoxyz"), "テスト"); // 変換結果の末尾のアルファベットは削除

        assert_eq!(r("konnnichiwa"), "コンニチワ");
        assert_eq!(r("konnichiwa"), "コンイチワ"); // "nn" は 優先的に "ン" に変換される
        assert_eq!(r("bannyuu"), "バンユウ"); // そうしなければ、"bannyu" が "バンニュ" になってしまう
        assert_eq!(r("tenka"), "テンカ"); // "n" が連続しない場合は "n" 1つでもOK
        assert_eq!(r("kon'nichiwa"), "コンニチワ"); // "n'" は "ン" になる (修正ヘボン式の規則)
        assert_eq!(r("k'on'nichiwa"), "k'オンニチワ"); // "n'" 以外の "'" はそのまま

        assert_eq!(r("matte"), "マッテ");
        assert_eq!(r("kitte"), "キッテ");
        assert_eq!(r("zasshi"), "ザッシ");
        assert_eq!(r("kanpai"), "カンパイ");
        assert_eq!(r("shinbunn"), "シンブン");
        assert_eq!(r("shinbun"), "シンブ");
        assert_eq!(r("tennnou"), "テンノウ");
        assert_eq!(r("bi-ru"), "ビール");

        assert_eq!(r("kya"), "キャ");
        assert_eq!(r("ryu"), "リュ");
        assert_eq!(r("sya"), "シャ");
        assert_eq!(r("sho"), "ショ");
        assert_eq!(r("tyu"), "チュ");
        assert_eq!(r("nn"), "ン");
        assert_eq!(r("n'n'"), "ンン");
        assert_eq!(r("nya"), "ニャ");
        assert_eq!(r("ltsu"), "ッ");
        assert_eq!(r("xtu"), "ッ");
        assert_eq!(r("xya"), "ャ");
        assert_eq!(r("xyo"), "ョ");
        assert_eq!(r("jya"), "ジャ");
        assert_eq!(r("jyi"), "ジィ");
        assert_eq!(r("jye"), "ジェ");
        assert_eq!(r("jyo"), "ジョ");
        assert_eq!(r("ou"), "オウ");
        assert_eq!(r("ei"), "エイ");

        assert_eq!(r("SaMuRaI"), "サムライ"); // 大文字小文字
        assert_eq!(r("Xyz123"), "xyz123"); // 非ローマ字はそのまま
        assert_eq!(r("2024nenn"), "2024ネン");

        assert_eq!(r("nna"), "ンア");
        assert_eq!(r("n'i"), "ンイ"); // アポストロフィ対応するなら
        assert_eq!(r("nma"), "ンマ");

        assert_eq!(r("koreha pen desu"), "コレハ ペン デス");
        assert_eq!(r("ohayou gozaimasu"), "オハヨウ ゴザイマス");
        assert_eq!(r("chuugokugo"), "チュウゴクゴ");
        assert_eq!(r("nyuuryokumojiretsu"), "ニュウリョクモジレツ");

        assert_eq!(r(""), "");
        assert_eq!(r("   "), "   ");
        assert_eq!(r("@@@"), "@@@");
        assert_eq!(r("te$uto"), "テ$ウト");
        assert_eq!(r("he!!o"), "ヘ!!オ");

        assert_eq!(r("こんにちは"), "こんにちは"); // 非ローマ字はそのまま
        assert_eq!(r("xyz漢字"), "xyz漢字");

        assert_eq!(r("n'"), "ン");
        assert_eq!(r("n-"), "ンー");
        assert_eq!(r("te--su--to"), "テーースーート");
        assert_eq!(r("te__su__to"), "テ__ス__ト");

        let long = "a".repeat(10_000);
        let result = r(&long);
        assert!(result.len() > 0); // 落ちないことだけ確認
    }
}
