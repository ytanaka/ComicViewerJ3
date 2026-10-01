//! RustとUIのあいだでやり取りする構造体の宣言
//!
//! `XyzUI` 構造体はRustからUIへ渡す型  
//! UI側で内部の `number` を別の型の type 宣言(`TabId`,`FileId`など)に置き換えて `Xyz` に変換して使用する
//!
//! `XyzOS` はRust側で使用する型。`XyzUI` と対になっている。
//!
//! `Xyz` はUI,Rust側共通で使用する型。

use std::{
    ffi::OsStr,
    fmt::{self, Display},
    num::NonZero,
    path::Path,
    sync::Arc,
};

use anyhow::anyhow;
use image::ImageBuffer;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::util::{parse_bool, vec_to_str};

// =====================================================================================================================

pub type TabId = u32;
pub type FileId = u64;
pub type TaskId = u32;

/// 2つの型のどちらか片方だけ保持するための構造体
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum Either<A, B> {
    Left(A),
    Right(B),
}
impl<A, B> Either<A, B> {
    pub fn right(&self) -> Option<&B> {
        match self {
            Either::Right(b) => Some(b),
            Either::Left(_) => None,
        }
    }
    // pub fn into_right(self) -> Option<B> {
    //     match self {
    //         Either::Right(b) => Some(b),
    //         Either::Left(_) => None,
    //     }
    // }

    pub fn map_right<BB, F: Fn(B) -> BB>(self, f: F) -> Either<A, BB> {
        match self {
            Either::Left(l) => Either::Left(l),
            Either::Right(r) => Either::Right(f(r)),
        }
    }
}

// =====================================================================================================================
//
//          ######            ###############         ###############
//          ######            ###############         ###############
//       ###      ###         ###            ###      ###            ###
//       ###      ###         ###            ###      ###            ###
//    ###            ###      ###            ###      ###            ###
//    ###            ###      ###            ###      ###            ###
//    ##################      ###############         ###############
//    ##################      ###############         ###############
//    ###            ###      ###                     ###
//    ###            ###      ###                     ###
//    ###            ###      ###                     ###
//    ###            ###      ###                     ###
//
// =====================================================================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// アプリ初期化時にRustからUIに渡す定数情報
pub struct AppConstants {
    /// ファイル更新イベントのID
    pub event_name_file_updaet: String,
    pub event_name_get_files_property: String,
    pub event_name_file_delete_progress: String,
    pub event_name_task_confirm: String,
    pub event_name_file_paste_progress_notify: String,
}
impl Default for AppConstants {
    fn default() -> Self {
        Self {
            event_name_file_updaet: EVENT_NAME_FILE_UPDATE_NOTIFY.to_string(),
            event_name_get_files_property: EVENT_NAME_GET_FILES_PROPERTY_NOTIFY.to_string(),
            event_name_file_delete_progress: EVENT_NAME_FILE_DELETE_PROGRESS_NOTIFY.to_string(),
            event_name_task_confirm: EVENT_NAME_TASK_CONFIRM.to_string(),
            event_name_file_paste_progress_notify: EVENT_NAME_FILE_PASTE_PROGRESS_NOTIFY
                .to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// プログラム起動 ([`invoke_program()`](crate::commands::app::invoke_program)) の結果
pub enum InvokeProgramResult {
    Success,
    Fail(String),
}

// =====================================================================================================================
//
//       ###############            ######            ###############            ############
//       ###############            ######            ###############            ############
//             ###               ###      ###         ###            ###      ###
//             ###               ###      ###         ###            ###      ###
//             ###            ###            ###      ###############            ############
//             ###            ###            ###      ###############            ############
//             ###            ##################      ###            ###                     ###
//             ###            ##################      ###            ###                     ###
//             ###            ###            ###      ###            ###      ###            ###
//             ###            ###            ###      ###            ###      ###            ###
//             ###            ###            ###      ###############            ############
//             ###            ###            ###      ###############            ############
//
// =====================================================================================================================

// u64 は JS の number に完全に変換できないが、53bitまでの値なら大丈夫
// ファイルid、ファイルサイズ、更新日時は 53bit 以内になるはず
// Rust の u64 を JS の number にするために、specta_typescript::Number を指定する (tauri_specta でエラーになる)

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// UIへ渡すタブ情報
pub struct TabInfoUI {
    #[specta(type = specta_typescript::Number)]
    pub id: TabId,

    pub path: String,
}

/// [`create_tab()`](crate::commands::tabs::create_tab) 、`clone_*()` コマンドの失敗情報
///
/// (指定されたディレクトリがないなど、システムエラーでない場合)
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct CreateTabError {
    pub msg: String,
}

/// UIへ返すファイル一覧の要素
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct DirEntryUI {
    #[specta(type = specta_typescript::Number)]
    pub file_id: FileId,

    pub is_dir: bool,
    pub is_symlink: bool,
    pub name: Arc<str>,
}

/// [`SortCondition`] の要素
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
pub enum SortType {
    /// 名前でソート
    Name,
    /// 拡張子でソート
    Ext,
    /// ファイルサイズでソート
    Size,
    /// 更新日時でソート
    Time,
}
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// ファイル一覧のソート条件 (どの要素でソートするか＋昇順/降順)
pub struct SortCondition {
    pub sort_type: SortType,
    /// 昇順: true
    pub asc: bool,
}
impl Default for SortCondition {
    fn default() -> Self {
        Self {
            sort_type: SortType::Name,
            asc: true,
        }
    }
}

/// UIに返す詳細ファイル情報
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileInfoUI {
    #[specta(type = specta_typescript::Number)]
    pub file_id: FileId,
    //  ※ FileInfoOS の metadata が Some でない場合はこの構造体は作成できない
    pub metadata: Arc<Either<String, FileMetadata>>,
}

#[derive(Clone)]
/// Rust内部で使用するファイル情報
pub struct FileInfoOS {
    pub name: Arc<OsStr>,
    pub is_dir: bool,
    pub is_symlink: bool,
    /// メタデータか、メタデータ取得時のエラーメッセージが入る
    pub metadata: Option<Arc<Either<String, FileMetadata>>>,
}
impl FileInfoOS {
    pub fn to_ui(&self, file_id: FileId) -> anyhow::Result<FileInfoUI> {
        Ok(FileInfoUI {
            file_id,
            metadata: self
                .metadata
                .clone()
                .ok_or_else(|| anyhow!("BUG: no metadata for `{}`", self.name.to_string_lossy()))?,
        })
    }
    pub fn get_size(&self) -> Option<u64> {
        self.get_metadata().and_then(|m| m.size)
    }
    pub fn get_modified(&self) -> Option<u64> {
        self.get_metadata().and_then(|m| m.modified)
    }
    fn get_metadata(&self) -> Option<&FileMetadata> {
        self.metadata.as_ref().and_then(|m| m.right())
    }
}

/// [`FileInfoUI`] に含まれるメタデータ
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
pub struct FileMetadata {
    #[specta(type = Option<specta_typescript::Number>)]
    pub size: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub modified: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub accessed: Option<u64>,

    #[specta(type = Option<specta_typescript::Number>)]
    pub created: Option<u64>,
}

// =====================================================================================================================
//
//    ##################         ############
//    ##################         ############
//    ###                     ###
//    ###                     ###
//    ###############            ############
//    ###############            ############
//    ###                                    ###
//    ###                                    ###
//    ###                     ###            ###
//    ###                     ###            ###
//    ###                        ############
//    ###                        ############
//
// =====================================================================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
/// ファイルのカットかコピーか
pub enum MoveOrCopy {
    Move,
    Copy,
}
impl Display for MoveOrCopy {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MoveOrCopy::Copy => write!(f, "copy"),
            MoveOrCopy::Move => write!(f, "move"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
/// ファイル操作(
/// [`create_file()`](crate::commands::fs::create_file),
/// [`create_directory()`](crate::commands::fs::create_directory),
/// [`rename_file()`](crate::commands::fs::rename_file),
/// )の結果
pub enum FileOpResult {
    /// 成功
    Success,
    /// 不正なファイル名
    InvalidFilename,
    /// すでに存在している
    AlreadyExists,
    /// システムエラー以外の失敗
    Fail { error_msg: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
/// クリップボードからファイルをペーストした結果
pub enum ClipboardPasteResult {
    /// クリップボードにファイルがなかったので何もしない
    NoFiles,
    /// 不正なパスなので何もしない
    InvalidPath { path: String },
    /// Cutされた結果を移動中
    ProgressMove,
    /// Copyされた結果をコピー中
    ProgressCopy,
}

// =====================================================================================================================
//
//    ###       ###            ###            ######               ############         ##################         ############
//    ###       ###            ###            ######               ############         ##################         ############
//    ###       ######      ######         ###      ###         ###            ###      ###                     ###
//    ###       ######      ######         ###      ###         ###            ###      ###                     ###
//    ###       ###   ######   ###      ###            ###      ###                     ###############            ############
//    ###       ###   ######   ###      ###            ###      ###                     ###############            ############
//    ###       ###            ###      ##################      ###      #########      ###                                    ###
//    ###       ###            ###      ##################      ###      #########      ###                                    ###
//    ###       ###            ###      ###            ###      ###            ###      ###                     ###            ###
//    ###       ###            ###      ###            ###      ###            ###      ###                     ###            ###
//    ###       ###            ###      ###            ###         ############         ##################         ############
//    ###       ###            ###      ###            ###         ############         ##################         ############
//
// =====================================================================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// width, height を持つ構造体
pub struct Dimension {
    pub width: u32,
    pub height: u32,
}
impl fmt::Display for Dimension {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}x{}", self.width, self.height)
    }
}
impl Dimension {
    pub fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }
    pub fn max(&self) -> u32 {
        self.width.max(self.height)
    }
}
impl<P, C> From<&ImageBuffer<P, C>> for Dimension
where
    P: image::Pixel + 'static,
    C: std::ops::Deref<Target = [P::Subpixel]>,
{
    fn from(img: &ImageBuffer<P, C>) -> Self {
        Dimension {
            width: img.width(),
            height: img.height(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
/// [`get_thumbnail()`](crate::commands::images::get_thumbnail) コマンドの結果
pub enum GetThumbnailResult {
    /// サムネイル画像ファイル名
    Ok { filename: String },
    /// 現在処理が集中しているので、リトライしてほしい
    Busy,
    /// 対象画像がない (ディレクトリの中に画像ファイルが見つからない)
    NoImage,
    /// その他 (画像ではない、ファイルが読めないなど)
    Fail { error_msg: String },
}
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
/// [`get_resized_img()`](crate::commands::images::get_resized_img) コマンドの結果
pub enum GetResizedImgResult {
    /// 処理済み画像ファイル名
    Ok { filename: String },
    /// 現在処理が集中しているので、リトライしてほしい
    Busy,
    /// その他 (画像ではない、ファイルが読めないなど)
    Fail { error_msg: String },
}

// =====================================================================================================================
//
//    ###            ###      ###         ############         ##################      ###            ###         ############
//    ###            ###      ###         ############         ##################      ###            ###         ############
//    ######      ######      ###      ###            ###      ###                     ######      ######      ###            ###
//    ######      ######      ###      ###            ###      ###                     ######      ######      ###            ###
//    ###   ######   ###      ###      ###                     ###############         ###   ######   ###      ###            ###
//    ###   ######   ###      ###      ###                     ###############         ###   ######   ###      ###            ###
//    ###            ###      ###      ###      #########      ###                     ###            ###      ###            ###
//    ###            ###      ###      ###      #########      ###                     ###            ###      ###            ###
//    ###            ###      ###      ###            ###      ###                     ###            ###      ###            ###
//    ###            ###      ###      ###            ###      ###                     ###            ###      ###            ###
//    ###            ###      ###         ############         ##################      ###            ###         ############
//    ###            ###      ###         ############         ##################      ###            ###         ############
//
// =====================================================================================================================

/// ファイル検索([`search_next_filename()`](crate::commands::search::search_next_filename))の結果
#[derive(Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "type")]
pub enum FileSearchResult {
    /// 見つかった
    Success {
        /// ファイルのインデックス (ソートされたファイル一覧の中の)
        index: i32,
        /// ファイル名
        name: String,
        /// ファイル名の中のマッチした部分
        match_str: String,
    },
    /// 形態素解析が終わっていない
    FailNoMatch,
    /// 見つからなかった
    FailNoCache,
    /// 状態が変わったのでキャンセル
    Canceled,
}
impl FileSearchResult {
    pub fn new_success(index: usize, name: &str, start: usize, end: usize) -> Self {
        FileSearchResult::Success {
            index: index as i32,
            name: name.to_string(),
            match_str: name.get(start..end).unwrap_or("").to_string(),
        }
    }
}
impl std::fmt::Debug for FileSearchResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FileSearchResult::Success {
                index,
                name: _name,
                match_str,
            } => write!(f, "Success {{[{}] {}}}", index, match_str),
            FileSearchResult::FailNoCache => write!(f, "FailNoCache"),
            FileSearchResult::FailNoMatch => write!(f, "FailNoMatch"),
            FileSearchResult::Canceled => write!(f, "Canceled"),
        }
    }
}

// =====================================================================================================================
//
//    ###############         ###############         ##################      ##################
//    ###############         ###############         ##################      ##################
//    ###            ###      ###            ###      ###                     ###
//    ###            ###      ###            ###      ###                     ###
//    ###            ###      ###            ###      ###############         ###############
//    ###            ###      ###            ###      ###############         ###############
//    ###############         ###############         ###                     ###
//    ###############         ###############         ###                     ###
//    ###                     ###         ###         ###                     ###
//    ###                     ###         ###         ###                     ###
//    ###                     ###            ###      ##################      ###
//    ###                     ###            ###      ##################      ###
//
// =====================================================================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// Rust側で保持するアプリ設定
pub struct AppPreferences {
    /// ファイル名検索するときスリープする
    pub debug_filename_search_sleep_ms: i32,
    /// ファイル削除時にスリープする
    pub debug_file_op_sleep_ms: i32,

    /// ファイル名ソート時の文字比較方法
    pub filename_cmp: FilenameCmpType,
    /// ファイル名ソート時、先頭の数字を数字として比較
    pub filename_cmp_by_digit: bool,

    /// ファイル名ソート時のCollator設定 (icu_collator::options::Strength)
    /// 'Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Identical'
    pub filename_sort_strength: String,

    /// サムネイルファイル削除期限
    pub thumbnail_expiration_days: i32,
    /// サムネイル作成同時実行数
    pub thumbnail_command_limit: u32,
    /// 画像リサイズ同時実行数
    pub resize_image_command_limit: u32,

    /// 画像リサイズ時の画質設定
    pub resize_image_config: ResizeImageConfig,
    /// リサイズ画像ファイル削除期限
    pub resized_image_expiration_minutes: i32,

    /// デフォルト値。UI側で参照のため (UI側ではnullにならない)
    pub default: Option<Box<AppPreferences>>,
}
impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            debug_filename_search_sleep_ms: 0,
            debug_file_op_sleep_ms: 0,
            filename_cmp: FilenameCmpType::Icu,
            filename_sort_strength: "Identical".to_string(),
            filename_cmp_by_digit: false,

            thumbnail_expiration_days: 30,
            thumbnail_command_limit: std::thread::available_parallelism()
                .unwrap_or(NonZero::new(4).unwrap())
                .get() as u32,

            resize_image_command_limit: std::thread::available_parallelism()
                .unwrap_or(NonZero::new(4).unwrap())
                .get() as u32,
            resize_image_config: ResizeImageConfig::default(),
            resized_image_expiration_minutes: 3,

            default: None,
        }
    }
}
impl AppPreferences {
    pub fn get_collator_options(&self) -> icu_collator::options::Strength {
        match self.filename_sort_strength.as_str() {
            "Primary" => icu_collator::options::Strength::Primary,
            "Secondary" => icu_collator::options::Strength::Secondary,
            "Tertiary" => icu_collator::options::Strength::Tertiary,
            "Quaternary" => icu_collator::options::Strength::Quaternary,
            _ => icu_collator::options::Strength::Identical,
        }
    }
    pub fn is_change_sort_config(&self, other: &AppPreferences) -> bool {
        self.filename_cmp != other.filename_cmp
            || self.filename_sort_strength != other.filename_sort_strength
            || self.filename_cmp_by_digit != other.filename_cmp_by_digit
    }
    pub fn init_default(&mut self) {
        self.default = Some(Box::new(Self::default()));
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
#[serde(tag = "type")]
/// ファイル名ソート時の文字比較方法 ([`AppPreferences`]の要素)
pub enum FilenameCmpType {
    /// Unicode文字コード順
    #[default]
    Unicode = 0,
    /// Shift-JIS
    Sjis,
    /// 自然
    Icu,
}
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// 画像リサイズ時の画質設定 ([`AppPreferences`]の要素)
pub struct ResizeImageConfig {
    pub unsharp_sigma: f32,
    pub unsharp_threshold: i32,
}
impl Default for ResizeImageConfig {
    fn default() -> Self {
        Self {
            unsharp_sigma: 0.5,
            unsharp_threshold: 30,
        }
    }
}

// =====================================================================================================================
//
//    ##################      ###            ###      ##################      ###            ###         ###############
//    ##################      ###            ###      ##################      ###            ###         ###############
//    ###                     ###            ###      ###                     ######         ###               ###
//    ###                     ###            ###      ###                     ######         ###               ###
//    ###############         ###            ###      ###############         ###   ###      ###               ###
//    ###############         ###            ###      ###############         ###   ###      ###               ###
//    ###                     ###            ###      ###                     ###      ###   ###               ###
//    ###                     ###            ###      ###                     ###      ###   ###               ###
//    ###                        ###      ###         ###                     ###         ######               ###
//    ###                        ###      ###         ###                     ###         ######               ###
//    ##################            ######            ##################      ###            ###               ###
//    ##################            ######            ##################      ###            ###               ###
//
// =====================================================================================================================

pub const EVENT_NAME_FILE_UPDATE_NOTIFY: &str = "file-update-notify";

/// ファイル更新をUIに通知する (タブ作成後からタブ削除までの間の変更を通知する)
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub struct FileUpdateNotifyEvent {
    #[specta(type = specta_typescript::Number)]
    pub tab_id: TabId,

    #[specta(type = Option<specta_typescript::Number>)]
    pub file_id: Option<FileId>, // Someの場合は、そのファイルのサイズや更新日時が変更された場合
                                 // Noneの場合は、そのディレクトリを再読み込みする必要がある場合
}

pub const EVENT_NAME_GET_FILES_PROPERTY_NOTIFY: &str = "get-files-property-notify";

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
/// ディレクトリの状態取得 ([`get_files_property()`](crate::commands::fs::get_files_property)) の途中経過を通知するイベント構造体
pub struct GetFilesPropertyNotifyEvent {
    pub task_id: TaskId,
    pub head: TaskEventHeader,
    pub progress: TaskEventFileProgress,
}
impl GetFilesPropertyNotifyEvent {
    pub fn new(task_id: TaskId) -> Self {
        Self {
            task_id,
            ..Default::default()
        }
    }
}

pub const EVENT_NAME_FILE_DELETE_PROGRESS_NOTIFY: &str = "file-delete-progress-notify";

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
/// ファイル削除 ([`remove_files()`](crate::commands::fs::remove_files)) の途中経過を通知するイベント構造体
pub struct RemoveFilesNotifyEvent {
    pub task_id: TaskId,
    pub head: TaskEventHeader,
    pub progress: TaskEventFileProgress,
}
impl RemoveFilesNotifyEvent {
    pub fn new(task_id: TaskId) -> Self {
        Self {
            task_id,
            ..Default::default()
        }
    }
}

pub const EVENT_NAME_FILE_PASTE_PROGRESS_NOTIFY: &str = "file-paste-progress-notify";

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
/// ファイルコピー、移動 ([`file_paste_from_clipboard()`](crate::commands::fs_clipboard::file_paste_from_clipboard)) の途中経過を通知するイベント構造体
pub struct FilePasteNotifyEvent {
    pub task_id: TaskId,
    pub is_copy: bool,
    pub head: TaskEventHeader,
    /// ファイルコピー時の準備状況 (移動時は無視する)
    pub prepare_progress: TaskEventFileProgress,
    /// ファイルコピー／移動時の経過
    pub progress: TaskEventFileProgress,
}
impl FilePasteNotifyEvent {
    pub fn new(task_id: TaskId, mode: &MoveOrCopy) -> Self {
        Self {
            task_id,
            is_copy: *mode == MoveOrCopy::Copy,
            ..Default::default()
        }
    }
}
pub struct FilePasteResponse {
    pub answer: FilePasteAnswer,
    pub always: bool,
}
impl FilePasteResponse {
    pub fn from(r: TaskResponse) -> Option<Self> {
        if r.t != TaskConfirmType::Paste {
            return None;
        }
        let arg0 = r.args.first().and_then(|s| FilePasteAnswer::parse(s));
        let arg1 = r.args.get(1).and_then(|s| parse_bool(s));
        match (arg0, arg1) {
            (Some(a), Some(b)) => Some(Self {
                answer: a,
                always: b,
            }),
            _ => None,
        }
    }
}
#[derive(Clone, Copy)]
pub enum FilePasteAnswer {
    Rename,
    Merge,
    Skip,
    Cancel,
}
impl FilePasteAnswer {
    pub fn parse(s: &str) -> Option<Self> {
        let ret = match s {
            "Rename" => FilePasteAnswer::Rename,
            "Merge" => FilePasteAnswer::Merge,
            "Skip" => FilePasteAnswer::Skip,
            "Cancel" => FilePasteAnswer::Cancel,
            _ => return None,
        };
        Some(ret)
    }
}

// =====================================================================================================================
//
//       ###############            ######               ############         ###            ###
//       ###############            ######               ############         ###            ###
//             ###               ###      ###         ###                     ###         ###
//             ###               ###      ###         ###                     ###         ###
//             ###            ###            ###         ############         ############
//             ###            ###            ###         ############         ############
//             ###            ##################                     ###      ###      ###
//             ###            ##################                     ###      ###      ###
//             ###            ###            ###      ###            ###      ###         ###
//             ###            ###            ###      ###            ###      ###         ###
//             ###            ###            ###         ############         ###            ###
//             ###            ###            ###         ############         ###            ###
//
// =====================================================================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum TaskConfirmType {
    /// cancel_task() が呼ばれたとき、タスクの Receiver 待ちをしているスレッドを起こすためにRust内部で使う
    Dummy,
    
    /// OkCancelダイアログを表示する
    /// * TaskConfirm.args[タイトル, メッセージ]
    /// * TaskResponse.args[OKされたかどうか: "true", "false"]
    OkCancel,
    
    /// ファイル上書き確認
    /// * TaskConfirm.args["move"|"copy", 元ファイル, 先ディレクトリ]
    /// * TaskResponse.args[FilePasteAnswer, 全てが選択された: "true", "false"]
    Paste,
}

pub const EVENT_NAME_TASK_CONFIRM: &str = "task-confirm";

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// RustからUIへTask関連問い合わせイベント
pub struct TaskConfirm {
    pub t: TaskConfirmType,
    pub task_id: TaskId,
    pub args: Vec<String>,
}
impl Display for TaskConfirm {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "task_id:{},{:?},{}",
            self.task_id,
            self.t,
            vec_to_str(&self.args)
        )
    }
}
impl TaskConfirm {
    pub fn new_paste(
        task_id: TaskId,
        mode: MoveOrCopy,
        src_path: impl AsRef<Path>,
        dst_dir: impl AsRef<Path>,
    ) -> Self {
        Self {
            t: TaskConfirmType::Paste,
            task_id,
            args: vec![
                mode.to_string(),
                src_path.as_ref().to_string_lossy().to_string(),
                dst_dir.as_ref().to_string_lossy().to_string(),
            ],
        }
    }
    pub fn new_ok_cancel(task_id: TaskId, title: &str, msg: &str) -> Self {
        Self {
            t: TaskConfirmType::OkCancel,
            task_id,
            args: vec![title.to_string(), msg.to_string()],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
/// Task問い合わせの応答
pub struct TaskResponse {
    pub task_id: TaskId,
    pub t: TaskConfirmType,
    pub args: Vec<String>,
}
impl Display for TaskResponse {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "task_id:{},{:?},{}",
            self.task_id,
            self.t,
            vec_to_str(&self.args)
        )
    }
}
impl TaskResponse {
    pub fn new_dummy(task_id: TaskId) -> Self {
        Self {
            task_id,
            t: TaskConfirmType::Dummy,
            args: Vec::new(),
        }
    }
}

pub struct OkCancelResponse {
    pub ok: bool,
}
impl OkCancelResponse {
    pub fn from(r: TaskResponse) -> Option<Self> {
        if r.t != TaskConfirmType::OkCancel {
            return None;
        }
        match r.args.first().and_then(|s| parse_bool(s)) {
            Some(ok) => Some(Self { ok }),
            _ => None,
        }
    }
}

// =====================================================================================================================
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
/// Rust側で継続的に処理するタスクの進捗状況を通知するイベントの共通ヘッダー
pub struct TaskEventHeader {
    /// 最後の通知かどうか
    pub finished: bool,

    /// キャンセルされたかどうか (finished == true の場合)
    pub canceled: bool,

    /// エラー発生時 (finished == true の場合)
    pub error_msg: Option<String>,
}
// =====================================================================================================================
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Default)]
/// タスクの処理経過情報の共通情報
pub struct TaskEventFileProgress {
    #[specta(type = specta_typescript::Number)]
    /// トータルファイルサイズ
    pub size: u64,

    /// ディレクトリ数
    pub dires: u32,

    /// ファイル数
    pub files: u32,

    /// シンボリックリンク数
    pub symlinks: u32,
}
