use std::{
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
};

use anyhow::anyhow;
use tauri::Emitter;
use walkdir::WalkDir;

use crate::{
    commands::fs_util::{get_file_name, get_parent, resolv_conflict_name, tmp_file},
    state::task::TaskContext,
    types::{
        FilePasteAnswer, FilePasteNotifyEvent, FilePasteResponse,
        MoveOrCopy::{self, Copy, Move},
        OkCancelResponse, TaskConfirm, EVENT_NAME_FILE_PASTE_PROGRESS_NOTIFY,
        EVENT_NAME_TASK_CONFIRM,
    },
    util::pathvec_to_str,
};

// =====================================================================================================================

pub type MoveCopyTaskContext = TaskContext<FilePasteNotifyEvent, FilePasteAnswer>;

// =====================================================================================================================
//
//    ###            ###         ############         ###            ###      ##################
//    ###            ###         ############         ###            ###      ##################
//    ######      ######      ###            ###      ###            ###      ###
//    ######      ######      ###            ###      ###            ###      ###
//    ###   ######   ###      ###            ###      ###            ###      ###############
//    ###   ######   ###      ###            ###      ###            ###      ###############
//    ###            ###      ###            ###      ###            ###      ###
//    ###            ###      ###            ###      ###            ###      ###
//    ###            ###      ###            ###         ###      ###         ###
//    ###            ###      ###            ###         ###      ###         ###
//    ###            ###         ############               ######            ##################
//    ###            ###         ############               ######            ##################
//
// =====================================================================================================================

/// ファイルを Ctrl+V で移動
pub fn move_paths(
    ctx: MoveCopyTaskContext,
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
        ctx.force_emit_next_event(); // 最後なので必ず通知させる
        let _ = emit_event_paste_progress(&mut ctx).err().map(|e| {
            log::error!("move_paths: notify error task_id={}, {}", ctx.task_id, e);
        });
    });

    Ok(())
}
async fn move_paths_impl1(
    ctx: &mut MoveCopyTaskContext,
    src_paths: Vec<PathBuf>,
    dst_dir: PathBuf,
) -> anyhow::Result<()> {
    // 実行確認
    if !confirm_exec(ctx, Move, &src_paths).await? {
        return Ok(());
    }

    // 全部移動する
    for src_path in src_paths {
        if ctx.is_canceled() {
            return Ok(());
        }
        let src_name = get_file_name(&src_path)?;
        let dst_path = dst_dir.join(src_name);
        move_paths_impl2(ctx, src_path, &dst_path).await?;
    }
    Ok(())
}
async fn move_paths_impl2(
    ctx: &mut MoveCopyTaskContext,
    src_path: PathBuf,
    dst_path: impl AsRef<Path>,
) -> anyhow::Result<()> {
    let dst_path = if !dst_path.as_ref().exists() {
        dst_path.as_ref().to_path_buf()
    } else {
        // 移動先に同じ名前がある...
        // 前回の回答が残っているか確認
        match ctx.answer {
            // 前回常にスキップすると答えた
            Some(FilePasteAnswer::Skip) => return Ok(()),
            // 前回常にリネームすると答えた (moveでMergeは来ないので無視)
            Some(_) => {}
            // 前回の答えがない...
            None => {
                // 問い合わせて回答を受け取る
                let dst_dir = get_parent(&dst_path)?;
                let response = ask_to_ui_paste_confilct(ctx, Move, &src_path, &dst_dir).await?;
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
        resolv_conflict_name(&src_path, &dst_path)?
    };

    // 移動!!!
    let src_is_file = src_path.is_file();
    fs::rename(&src_path, dst_path)?;

    if src_is_file {
        ctx.event.progress.files += 1;
    } else {
        ctx.event.progress.dires += 1;
    }
    emit_event_paste_progress(ctx)?;

    ctx.debug_sleep();

    Ok(())
}

// =====================================================================================================================
//
//       ############            ############         ###############          ###         ###
//       ############            ############         ###############          ###         ###
//    ###            ###      ###            ###      ###            ###          ###   ###
//    ###            ###      ###            ###      ###            ###          ###   ###
//    ###                     ###            ###      ###            ###             ###
//    ###                     ###            ###      ###            ###             ###
//    ###                     ###            ###      ###############                ###
//    ###                     ###            ###      ###############                ###
//    ###            ###      ###            ###      ###                            ###
//    ###            ###      ###            ###      ###                            ###
//       ############            ############         ###                            ###
//       ############            ############         ###                            ###
//
// =====================================================================================================================

/// ファイルを Ctrl+V でコピー
pub fn copy_paths(
    ctx: MoveCopyTaskContext,
    src_paths: Vec<PathBuf>,
    dst_dir: PathBuf,
) -> anyhow::Result<()> {
    let mut ctx = ctx;
    tauri::async_runtime::spawn(async move {
        log::debug!(
            "spawn copy_paths(...,{},{:?})",
            pathvec_to_str(&src_paths),
            dst_dir
        );
        let ret = copy_paths_impl1(&mut ctx, src_paths, dst_dir).await;
        match ret {
            Ok(_) => {
                ctx.event.head.error_msg = None;
            }
            Err(e) => {
                ctx.event.head.error_msg = Some(e.to_string());
                log::error!("copy_paths: error task_id={}, {}", ctx.task_id, e);
            }
        }
        ctx.event.head.finished = true;
        ctx.event.head.canceled = ctx.is_canceled();
        ctx.force_emit_next_event(); // 最後なので必ず通知させる
        let _ = emit_event_paste_progress(&mut ctx).err().map(|e| {
            log::error!("copy_paths: notify error task_id={}, {}", ctx.task_id, e);
        });
    });

    Ok(())
}
async fn copy_paths_impl1(
    ctx: &mut MoveCopyTaskContext,
    src_paths: Vec<PathBuf>,
    dst_dir: PathBuf,
) -> anyhow::Result<()> {
    // 実行確認
    if !confirm_exec(ctx, Copy, &src_paths).await? {
        return Ok(());
    }

    // 準備
    for path in &src_paths {
        if ctx.is_canceled() {
            return Ok(());
        }
        copy_paths_prepare(ctx, path).await?;
    }

    // 全部コピーする
    for src_path in src_paths {
        if ctx.is_canceled() {
            return Ok(());
        }
        copy_paths_impl2(ctx, src_path, &dst_dir).await?;
    }
    Ok(())
}
/// コピー元検査
async fn copy_paths_prepare(
    ctx: &mut MoveCopyTaskContext,
    path: impl AsRef<Path>,
) -> anyhow::Result<()> {
    for walk in WalkDir::new(path) {
        if ctx.is_canceled() {
            return Ok(());
        }

        let f = walk?;
        let meta = f.metadata()?;
        if meta.is_symlink() {
            return Err(err_cp_symlink(f.path()));
        } else if meta.is_dir() {
            ctx.event.prepare_progress.dires += 1;
        } else {
            ctx.event.prepare_progress.files += 1;
            ctx.event.prepare_progress.size += meta.len();
        }

        emit_event_paste_progress(ctx)?;

        ctx.debug_sleep();
    }

    Ok(())
}
enum DirOrFile {
    Dir,
    File,
}
/// * `src_path`: クリップボードから渡されたパス (ファイル or ディレクトリ)
/// * `dst_dir`: タブのカレントディレクトリ
async fn copy_paths_impl2(
    ctx: &mut MoveCopyTaskContext,
    src_path: impl AsRef<Path>,
    dst_dir: impl AsRef<Path>,
) -> anyhow::Result<()> {
    // async fn の再帰呼び出しでエラーになったのでループさせる
    let mut stack: Vec<(PathBuf, PathBuf)> = Vec::new();
    stack.push((
        src_path.as_ref().to_path_buf(), // src: ファイル or ディレクトリ
        dst_dir.as_ref().to_path_buf(),  // dst: 必ずディレクトリ
    ));

    while let Some((src_path, dst_dir)) = stack.pop() {
        let src_name = get_file_name(&src_path)?;
        let mut dst_path = dst_dir.join(&src_name);

        // シンボリックリンクになっていないか、ファイル同士、ディレクトリ同士か確認
        // src_path 例: /a/b/c.txt
        // dst_path 例: /x/y/z/c.txt
        check_src_dst_metadata(&src_path, &dst_path)?;

        // dst_path が存在するなら、上書きかリネームか判定する
        if dst_path.exists() {
            // リネームされるなら、dst_path は別の名前になる
            dst_path = match resolve_copy_path_confilct(ctx, &src_path, &dst_path).await? {
                None => return Ok(()),
                Some(p) => p,
            }
        };

        if matches!(
            copy_paths_impl3(ctx, &src_path, &dst_path).await?,
            DirOrFile::Dir
        ) {
            // ディレクトリをコピー処理したら、その子をループで処理する
            for entry in fs::read_dir(&src_path)? {
                stack.push((
                    entry?.path().to_path_buf(), // 例: /a/b/c/d.txt
                    dst_path.clone(), // 例: /x/y/z/Copy(2)_c (resolve_copy_path_confilct で "c" がすでに存在したためリネームした場合)
                ))
            }
        }
    }

    Ok(())
}
//// 元、先にシンボリックリンクが含まれていないか、元、先がファイル同士とディレクトリ同士になっているか確認
fn check_src_dst_metadata(
    src_path: impl AsRef<Path>,
    dst_path: impl AsRef<Path>,
) -> anyhow::Result<()> {
    let src_meta = src_path.as_ref().metadata()?;
    if let Ok(dst_meta) = dst_path.as_ref().metadata() {
        if dst_meta.is_symlink() {
            return Err(err_cp_symlink(dst_path));
        }
        if src_meta.is_symlink() {
            return Err(err_cp_symlink(src_path));
        }
        if src_meta.is_file() && dst_meta.is_dir() {
            return Err(anyhow!(
                "ファイルのコピー先に同名のディレクトリがあります {:?}",
                src_path.as_ref().to_string_lossy(),
            ));
        }
        if src_meta.is_dir() && dst_meta.is_file() {
            return Err(anyhow!(
                "ディレクトリのコピー先に同名のファイルがあります {:?}",
                src_path.as_ref().to_string_lossy(),
            ));
        }
    }
    Ok(())
}
fn err_cp_symlink(path: impl AsRef<Path>) -> anyhow::Error {
    anyhow!("このアプリではリンクはコピーできません {:?}", path.as_ref())
}
/// コピー先がすでに存在するとき、どう対処するか決める
///
/// # Return
/// * `Some(すでに存在するパス)`: 上書きする
/// * `Some(新しいパス)`: リネームする
/// * `None`: スキップ
async fn resolve_copy_path_confilct(
    ctx: &mut MoveCopyTaskContext,
    src_path: impl AsRef<Path>,
    dst_path: impl AsRef<Path>,
) -> anyhow::Result<Option<PathBuf>> {
    // 前回の回答が残っているか確認
    let ret = match ctx.answer {
        // 前回常にスキップすると答えた
        Some(FilePasteAnswer::Skip) => return Ok(None),
        // 前回常にリネームすると答えた
        Some(FilePasteAnswer::Rename) => {
            // 別の名前にする
            resolv_conflict_name(&src_path, &dst_path)?
        }
        // 前回常にマージすると答えた
        Some(FilePasteAnswer::Merge) => {
            // ファイルなら上書き、ディレクトリなら何もしない
            dst_path.as_ref().to_path_buf()
        }
        // 前回の答えがない...
        _ => {
            // 問い合わせて回答を受け取る
            let response = ask_to_ui_paste_confilct(ctx, Copy, &src_path, &dst_path).await?;
            if response.always {
                ctx.answer = Some(response.answer);
            }
            let ret = match response.answer {
                FilePasteAnswer::Cancel => {
                    ctx.cancel_task();
                    return Ok(None);
                }
                FilePasteAnswer::Skip => return Ok(None),
                FilePasteAnswer::Rename => resolv_conflict_name(&src_path, &dst_path)?,
                FilePasteAnswer::Merge => dst_path.as_ref().to_path_buf(),
            };
            ret
        }
    };
    Ok(Some(ret))
}
/// コピーする
///
/// # Parameter
/// * `src_path`: コピー元ファイル or ディレクトリ
/// * `dst_path`: コピー先ファイル or ディレクトリ (すでに存在するときは上書きする)
///
/// src_path と dst_path は両方ファイル or 両方ディレクトリ
async fn copy_paths_impl3(
    ctx: &mut MoveCopyTaskContext,
    src_path: impl AsRef<Path>,
    dst_path: impl AsRef<Path>,
) -> anyhow::Result<DirOrFile> {
    let meta = src_path.as_ref().metadata()?;
    let ret = if meta.is_dir() {
        copy_paths_dir(dst_path).await?;
        ctx.event.progress.dires += 1;
        DirOrFile::Dir
    } else {
        copy_paths_file(ctx, src_path, dst_path).await?;
        ctx.event.progress.files += 1;
        ctx.event.progress.size += meta.len();
        DirOrFile::File
    };

    emit_event_paste_progress(ctx)?;

    ctx.debug_sleep();

    Ok(ret)
}
async fn copy_paths_dir(dst_path: impl AsRef<Path>) -> anyhow::Result<()> {
    if !dst_path.as_ref().exists() {
        fs::create_dir(dst_path)?;
    }
    Ok(())
}
async fn copy_paths_file(
    ctx: &mut MoveCopyTaskContext,
    src_path: impl AsRef<Path>,
    dst_path: impl AsRef<Path>,
) -> anyhow::Result<()> {
    // ファイルコピー
    let tmp_dst_path = tmp_file(&dst_path)?;
    copy_paths_file2(ctx, &src_path, &tmp_dst_path).await?;
    if ctx.is_canceled() {
        fs::remove_file(tmp_dst_path)?;
        return Ok(());
    }
    fs::rename(&tmp_dst_path, &dst_path)?;

    // 更新日時を合わせる
    let src_meta = &src_path.as_ref().metadata()?;
    let f = File::options().write(true).open(&dst_path)?;
    f.set_modified(src_meta.modified()?)?;
    Ok(())
}
async fn copy_paths_file2(
    ctx: &mut MoveCopyTaskContext,
    src_path: impl AsRef<Path>,
    dst_path: impl AsRef<Path>,
) -> anyhow::Result<()> {
    let mut src_f = File::open(&src_path)?;
    let mut dst_f = File::create(&dst_path)?;
    let mut buffer = [0u8; 1024 * 1024];

    loop {
        let n = src_f.read(&mut buffer)?;
        if n == 0 {
            break;
        }
        dst_f.write_all(&buffer[..n])?;

        if ctx.is_canceled() {
            break;
        }
    }
    Ok(())
}
// =====================================================================================================================
//
//    ###            ###         ###############          ###            ###
//    ###            ###         ###############          ###            ###
//    ###            ###               ###                ###            ###
//    ###            ###               ###                ###            ###
//    ###            ###               ###                ###            ###
//    ###            ###               ###                ###            ###
//    ###            ###               ###                ###            ###
//    ###            ###               ###                ###            ###
//    ###            ###               ###                ###            ###
//    ###            ###               ###                ###            ###
//       ############                  ###                ###            ##################
//       ############                  ###                ###            ##################
//
// =====================================================================================================================

async fn confirm_exec(
    ctx: &mut MoveCopyTaskContext,
    mode: MoveOrCopy,
    src_paths: &[PathBuf],
) -> anyhow::Result<bool> {
    // 実行確認
    let mut msg = String::new();
    for p in src_paths.iter().take(5) {
        if !msg.is_empty() {
            msg.push('\n');
        }
        msg.push_str(&p.to_string_lossy());
    }
    if 5 < src_paths.len() {
        msg.push_str("\n.....");
        msg.push_str(&format!("\n合計 {}", src_paths.len()));
    }

    let title = match mode {
        Move => "移動確認",
        Copy => "コピー確認",
    };

    let res = ask_to_ui_ok_cancel(ctx, title, &msg).await?;
    if res.ok {
        Ok(true)
    } else {
        ctx.cancel_task();
        Ok(false)
    }
}

async fn ask_to_ui_paste_confilct(
    ctx: &mut MoveCopyTaskContext,
    mode: MoveOrCopy,
    src_path: impl AsRef<Path>,
    dst_dir: impl AsRef<Path>,
) -> anyhow::Result<FilePasteResponse> {
    let ev = TaskConfirm::new_paste(ctx.task_id, mode, src_path, dst_dir);
    // UIにイベントを送る
    log::trace!("send to ui TaskConfirm: {}", ev);
    ctx.app.emit(EVENT_NAME_TASK_CONFIRM, ev)?;

    // UIの応答を待つ
    let ret = ctx.rx.recv()?;
    log::trace!("receive from ui TaskResponse: {}", ret);

    let ret = FilePasteResponse::from(ret).ok_or(anyhow!("invalid TaskResponse"))?;
    Ok(ret)
}
fn emit_event_paste_progress(ctx: &mut MoveCopyTaskContext) -> anyhow::Result<()> {
    if !ctx.can_emit_event()? {
        return Ok(());
    }
    ctx.app
        .emit(EVENT_NAME_FILE_PASTE_PROGRESS_NOTIFY, ctx.event.clone())?;
    Ok(())
}

async fn ask_to_ui_ok_cancel<E, A>(
    ctx: &mut TaskContext<E, A>,
    title: &str,
    msg: &str,
) -> anyhow::Result<OkCancelResponse> {
    let ev = TaskConfirm::new_ok_cancel(ctx.task_id, title, msg);
    // UIにイベントを送る
    log::trace!("send to ui TaskConfirm: {}", ev);
    ctx.app.emit(EVENT_NAME_TASK_CONFIRM, ev)?;

    // UIの応答を待つ
    let ret = ctx.rx.recv()?;
    log::trace!("receive from ui TaskResponse: {}", ret);

    let ret = OkCancelResponse::from(ret).ok_or(anyhow!("invalid TaskResponse"))?;
    Ok(ret)
}
