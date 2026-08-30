use std::{fs::File, path::Path};

use zip::ZipArchive;

// build.rs
fn main() {
    // Tauriのビルドに必要
    tauri_build::build();

    download_rustmigemo_dict();
    download_vibrato_dict();
    download_migemo();
}

// src-tauri/src/text-search/Migemo で使用する辞書
fn download_rustmigemo_dict() {
    if exists_target_file("dict/migemo-compact-dict/migemo-compact-dict") {
        return;
    };

    let out_dir = Path::new("dict");
    let download_filename = "migemo-compact-dict.zip";

    // github.com/oguna/migemo-compact-dict-latest だと、"ryuu" で漢字が出ない。
    // github.com/oguna/yet-another-migemo-dict なら "ryuu" で漢字が出るのでこちらを使用する
    download(
        "https://github.com/oguna/yet-another-migemo-dict/releases/download/v0.6/migemo-compact-dict.zip",
        out_dir,
        download_filename,
    );

    let dest_dir = out_dir.join("migemo-compact-dict");
    let file = File::open(out_dir.join(download_filename)).unwrap();
    let mut archive = ZipArchive::new(file).unwrap();
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).unwrap();
        let path = dest_dir.join(file.name());
        if file.is_file() {
            let parent = path.parent().unwrap();
            std::fs::create_dir_all(parent).unwrap();
            let mut outfile = File::create(path).unwrap();
            std::io::copy(&mut file, &mut outfile).unwrap();
        }
    }
}

// src-tauri/src/text-search/Vibrato で使用する辞書
fn download_vibrato_dict() {
    if exists_target_file("dict/unidic-cwj-3_1_1+compact/system.dic.zst") {
        return;
    };

    let out_dir = Path::new("dict");
    let download_filename = "unidic-cwj-3_1_1+compact.tar.xz";
    download(
        "https://github.com/daac-tools/vibrato/releases/download/v0.5.0/unidic-cwj-3_1_1+compact.tar.xz",
        out_dir,
        download_filename,
    );

    let out_path = out_dir.join(download_filename);
    let out_file = File::open(&out_path).unwrap();
    let tar = xz2::read::XzDecoder::new(out_file);
    let mut archive = tar::Archive::new(tar);
    archive.unpack(out_dir).unwrap();
}

// src-tauri/src/text-search/ReverseMigemo で使用するオリジナル migemo 辞書
fn download_migemo() {
    if exists_target_file("dict/migemo-0.40/migemo-dict") {
        return;
    };

    let out_dir = Path::new("dict");
    let download_filename = "migemo-0.40.tar.gz";
    download(
        "https://0xcc.net/migemo/migemo-0.40.tar.gz",
        out_dir,
        download_filename,
    );

    let out_path = out_dir.join(download_filename);
    let out_file = File::open(&out_path).unwrap();
    let tar = flate2::read::GzDecoder::new(out_file);
    let mut archive = tar::Archive::new(tar);
    archive.unpack(out_dir).unwrap();
}

fn download(url: &str, out_dir: impl AsRef<Path>, filename: &str) {
    let out_path = out_dir.as_ref().join(filename);

    if out_path.exists() {
        println!("Using {}", filename);
        return;
    }

    let bytes = reqwest::blocking::get(url).unwrap().bytes().unwrap();
    std::fs::create_dir_all(out_dir).unwrap();
    std::fs::write(out_path, &bytes).unwrap();
}

fn exists_target_file(path: impl AsRef<Path>) -> bool {
    if path.as_ref().is_file() {
        println!("Using cached {:?}", path.as_ref());
        return true;
    }
    false
}
