//! アプリ全体
use std::{process::Command, sync::Arc};

use tauri::{AppHandle, State, Window};

use crate::{
    LOG_RESULT, state::app_state::AppState, types::{
        AppConstants, FilePasteNotifyEvent, FileUpdateNotifyEvent, GetFilesPropertyNotifyEvent, InvokeProgramResult::{self, Fail, Success}, RemoveFilesNotifyEvent, TaskId, TaskResponse,
    },
};

#[tauri::command]
#[specta::specta]
/// Rust側の初期化 (ほかのコマンドを使用する前に呼ぶ)
pub async fn init(app: AppHandle, state: State<'_, Arc<AppState>>) -> Result<AppConstants, String> {
    let state2 = state.inner().clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        log::info!("command::init() start");
        state2.init(Arc::new(app), state2.clone());
        log::info!("command::init() end");
    });
    result.await.unwrap();
    Ok(AppConstants::default())
}

#[tauri::command]
#[specta::specta]
/// アプリ終了
pub fn exit_app(app: AppHandle, state: State<'_, Arc<AppState>>) {
    log::info!("command::exit_app()");
    state.stop();
    app.exit(0);
}

#[tauri::command]
#[specta::specta]
/// フルスクリーン
pub fn set_fullscreen(window: Window, fullscreen: bool) {
    let _ = window.set_fullscreen(fullscreen);
}

#[tauri::command]
#[specta::specta]
/// 外部プログラム起動
pub async fn invoke_program(
    current_dir: String,
    program: String,
    args: Vec<String>,
) -> Result<InvokeProgramResult, String> {
    LOG_RESULT!(format!("invoke_program({}, {:?})", program, args), {
        invoke_program_impl(current_dir, program, args)
            .await
            .map_err(|e| e.to_string())
    })
}
async fn invoke_program_impl(
    current_dir: String,
    program: String,
    args: Vec<String>,
) -> anyhow::Result<InvokeProgramResult> {
    match Command::new(program)
        .args(args)
        .current_dir(current_dir)
        .spawn()
    {
        Ok(_) => Ok(Success),
        Err(e) => Ok(Fail(e.to_string())), // 起動できないのはシステムエラーではない
    }
}

#[tauri::command]
#[specta::specta]
/// タスク中断
pub fn cancel_task(state: State<'_, Arc<AppState>>, task_id: TaskId) {
    log::info!("command::cancel_task({})", task_id);
    state.get_task(task_id).cancel_task();
}

#[tauri::command]
#[specta::specta]
/// コピー、移動時の確認に対する応答
pub fn respond_to_task(state: State<'_, Arc<AppState>>, task_id: TaskId, response: TaskResponse) {
    log::trace!("respond_to_task({},...)", task_id);
    state.get_task(task_id).set_response(response);
}

#[tauri::command]
#[specta::specta]
/// ダミー
pub fn dummy(
    _file_notify: FileUpdateNotifyEvent,
    _prepare: GetFilesPropertyNotifyEvent,
    _remove: RemoveFilesNotifyEvent,
    _copy_move: FilePasteNotifyEvent,
) {
    log::info!("command::dummy()");
}
