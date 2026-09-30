use std::{
    fs,
    path::{Path, PathBuf},
    time::Duration,
};

use tauri::Emitter;

use crate::{
    commands::fs_util::{get_dst_path, resolv_conflict_name},
    state::task::TaskContext,
    types::{
        FilePasteConfirmEvent, FilePasteNotifyEvent, TaskAnswer, TaskResponse,
        EVENT_NAME_FILE_PASTE_CONFIRM, EVENT_NAME_FILE_PASTE_PROGRESS_NOTIFY,
    },
    util::pathvec_to_str,
};

pub type MovePathsTaskContext = TaskContext<FilePasteNotifyEvent>;

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
                Some(TaskAnswer::Skip) => return Ok(()),
                // 前回常にリネームすると答えた
                Some(_) => {}
                // 前回の答えがない...
                None => {
                    // 問い合わせて回答を受け取る
                    let response = ask_to_ui(ctx, &src_path, &dst_dir, true).await?;
                    match response.answer {
                        TaskAnswer::Cancel => {
                            ctx.cancel_task();
                            return Ok(());
                        }
                        TaskAnswer::Skip => {
                            if response.always {
                                ctx.answer = Some(TaskAnswer::Skip);
                            };
                            return Ok(());
                        }
                        _ => {
                            // 移動の場合はMergeがないので、Renameとみなす
                            if response.always {
                                ctx.answer = Some(TaskAnswer::Rename);
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
    is_file: bool,
) -> anyhow::Result<TaskResponse> {
    let ev = FilePasteConfirmEvent {
        task_id: ctx.task_id,
        mode: crate::types::MoveOrCopy::Move,
        src_path: src_path.as_ref().to_string_lossy().to_string(),
        dst_dir: dst_dir.as_ref().to_string_lossy().to_string(),
        is_file,
    };
    // UIにイベントを送る
    log::trace!(
        "send to ui FilePasteConfirmEvent: {} => {}",
        src_path.as_ref().to_string_lossy(),
        dst_dir.as_ref().to_string_lossy()
    );
    ctx.app.emit(EVENT_NAME_FILE_PASTE_CONFIRM, ev)?;

    // UIの応答を待つ
    let ret = ctx.rx.recv()?;
    log::trace!("receive from ui: TaskResponse({:?})", ret.answer);

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
