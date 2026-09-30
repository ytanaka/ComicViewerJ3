use std::{
    fs,
    path::{Path, PathBuf},
    time::Duration,
};

use anyhow::anyhow;
use tauri::Emitter;

use crate::{
    commands::fs_util::{get_dst_path, resolv_conflict_name},
    state::task::TaskContext,
    types::{
        FilePasteAnswer, FilePasteNotifyEvent, FilePasteResponse, TaskConfirm,
        EVENT_NAME_FILE_PASTE_PROGRESS_NOTIFY, EVENT_NAME_TASK_CONFIRM,
    },
    util::pathvec_to_str,
};

pub type MovePathsTaskContext = TaskContext<FilePasteNotifyEvent, FilePasteAnswer>;

/// ファイルを Ctrl+V で移動
pub fn move_paths(
    ctx: MovePathsTaskContext,
    src_paths: Vec<PathBuf>,
    dst_dir: PathBuf,
) -> anyhow::Result<()> {
    let mut ctx = ctx;
    tauri::async_runtime::spawn(async move {
        log::debug!(
            "spawn move_paths(...,{},{:?})",
            pathvec_to_str(&src_paths),
            dst_dir
        );
        let ret = move_paths_impl1(&mut ctx, src_paths, dst_dir).await;
        match ret {
            Ok(_) => {
                ctx.event.head.error_msg = None;
            }
            Err(e) => {
                ctx.event.head.error_msg = Some(e.to_string());
                log::error!("move_paths: error task_id={}, {}", ctx.task_id, e);
            }
        }
        ctx.event.head.finished = true;
        ctx.event.head.canceled = ctx.is_canceled();
        ctx.event.head.event_time_ms = 0; // 最後なので必ず通知させる
        let _ = emit_event_move_paths(&mut ctx).err().map(|e| {
            log::error!("move_paths: notify error task_id={}, {}", ctx.task_id, e);
        });
    });

    Ok(())
}
async fn move_paths_impl1(
    ctx: &mut MovePathsTaskContext,
    src_paths: Vec<PathBuf>,
    dst_dir: PathBuf,
) -> anyhow::Result<()> {
    for src_path in src_paths {
        if ctx.is_canceled() {
            return Ok(());
        }
        move_paths_impl2(ctx, src_path, &dst_dir).await?;
    }
    Ok(())
}
async fn move_paths_impl2(
    ctx: &mut MovePathsTaskContext,
    src_path: PathBuf,
    dst_dir: impl AsRef<Path>,
) -> anyhow::Result<()> {
    let dst_path = match get_dst_path(&src_path, &dst_dir)? {
        // 移動先に同じ名前がないのでOK
        Some(p) => p,
        // 移動先に同じ名前がある...
        None => {
            // 前回の回答が残っているか確認
            match ctx.answer {
                // 前回常にスキップすると答えた
                Some(FilePasteAnswer::Skip) => return Ok(()),
                // 前回常にリネームすると答えた (moveでMergeは来ないので無視)
                Some(_) => {}
                // 前回の答えがない...
                None => {
                    // 問い合わせて回答を受け取る
                    let response = ask_to_ui(ctx, &src_path, &dst_dir).await?;
                    match response.answer {
                        FilePasteAnswer::Cancel => {
                            ctx.cancel_task();
                            return Ok(());
                        }
                        FilePasteAnswer::Skip => {
                            if response.always {
                                ctx.answer = Some(FilePasteAnswer::Skip);
                            };
                            return Ok(());
                        }
                        _ => {
                            // 移動の場合はMergeがないので、Renameとみなす
                            if response.always {
                                ctx.answer = Some(FilePasteAnswer::Rename);
                            }
                        }
                    };
                }
            }

            // 別の名前にする
            resolv_conflict_name(&src_path, &dst_dir)?
        }
    };

    // 移動!!!
    fs::rename(&src_path, dst_path)?;

    let pref = ctx.state.preferences.read().unwrap();
    let sleep = pref.debug_file_op_sleep_ms;
    if 0 < sleep {
        std::thread::sleep(Duration::from_millis(sleep as u64));
    }

    Ok(())
}
async fn ask_to_ui(
    ctx: &mut MovePathsTaskContext,
    src_path: impl AsRef<Path>,
    dst_dir: impl AsRef<Path>,
) -> anyhow::Result<FilePasteResponse> {
    let ev = TaskConfirm::new_paste(ctx.task_id, "move", src_path, dst_dir);
    // UIにイベントを送る
    log::trace!("send to ui TaskConfirm: {}", ev.to_string());
    ctx.app.emit(EVENT_NAME_TASK_CONFIRM, ev)?;

    // UIの応答を待つ
    let ret = ctx.rx.recv()?;
    log::trace!("receive from ui TaskResponse: {}", ret.to_string());

    let ret = FilePasteResponse::from(ret).ok_or(anyhow!("invalid TaskResponse"))?;
    Ok(ret)
}
fn emit_event_move_paths(ctx: &mut MovePathsTaskContext) -> anyhow::Result<()> {
    if !ctx.can_emit_event()? {
        return Ok(());
    }
    ctx.app
        .emit(EVENT_NAME_FILE_PASTE_PROGRESS_NOTIFY, ctx.event.clone())?;
    Ok(())
}
