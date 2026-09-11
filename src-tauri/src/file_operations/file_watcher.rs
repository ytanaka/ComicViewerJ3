use std::{
    path::{Path, PathBuf},
    sync::Arc,
};

use notify::{
    event::ModifyKind, recommended_watcher, Event, EventKind, RecommendedWatcher, RecursiveMode,
    Watcher,
};

use crate::{
    state::{
        app_state::AppState,
        util::{AppContext, EventEmitter},
    },
    types::{FileId, FileNotifyEvent, TabId, EVENT_ID_FILE_NOTIFY},
};

// ---------------------------------------------------------------------------------------------------------------------
pub struct FileWatcher {
    watcher: Option<RecommendedWatcher>,
}
impl FileWatcher {
    pub fn new<E: EventEmitter>(
        app: AppContext<E>,
        state: &Arc<AppState>,
        tab_id: TabId,
        path: impl AsRef<Path>,
    ) -> anyhow::Result<Self> {
        if app.is_dummy() {
            return Ok(FileWatcher { watcher: None });
        }

        let handler = FileWatcherHandler {
            app,
            state: state.clone(),
            tab_id,
        };
        let mut watcher = recommended_watcher(move |ev| {
            handler.handle_event(ev);
        })?;
        // notify-debouncer-full を使うと、大量にファイルのあるディレクトリで watch() すると時間がかかるので notify を使う
        watcher.watch(path.as_ref(), RecursiveMode::NonRecursive)?;
        Ok(FileWatcher {
            watcher: Some(watcher),
        })
    }

    pub fn stop(&mut self) {
        if let Some(d) = self.watcher.take() {
            std::mem::drop(d);
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------------
struct FileWatcherHandler<E: EventEmitter> {
    app: AppContext<E>,
    state: Arc<AppState>,
    tab_id: TabId,
}
impl<E: EventEmitter> FileWatcherHandler<E> {
    fn handle_event(&self, ev: notify::Result<Event>) {
        match ev {
            Ok(event) => {
                if let Err(e) = self.handle_ok_event(event) {
                    log::error!("FileWatcher error: {}", e);
                };
            }
            Err(error) => {
                // 何をしていいのかわからないので、ログを出しておく
                log::error!("{}", error);
            }
        }
    }
    fn handle_ok_event(&self, ev: Event) -> anyhow::Result<()> {
        log::trace!(
            "FileWatcher {:?}: (tab:{}) {:?}",
            ev.kind,
            self.tab_id,
            paths_str(&ev.paths)
        );

        match ev.kind {
            EventKind::Access(_) => { /* 無視する */ }
            EventKind::Create(_) => self.ui_all_refresh()?,
            EventKind::Remove(_) => self.ui_all_refresh()?,
            EventKind::Modify(kind) => {
                match kind {
                    ModifyKind::Any | ModifyKind::Data(_) | ModifyKind::Metadata(_) => {
                        // Windowsではファイル編集したときに Any が通知された
                        // Linuxで内容変更時 Data、日時更新時 Metadata
                        self.handle_1file_modify(ev)?
                    }
                    _ => {
                        // Windowsでは、リネームされたときに Name(From), Name(To) が通知された
                        // Linuxでは、リネームされたときに Name(From), Name(To), Name(Both) が通知された
                        self.ui_all_refresh()?;
                    }
                }
            }
            ev => {
                log::warn!("UNKNOWN Event: {:?}", ev);
                self.ui_all_refresh()?
            }
        };
        Ok(())
    }
    fn handle_1file_modify(&self, ev: Event) -> anyhow::Result<()> {
        // Windowsではファイル編集したときに Any が通知された
        // Linuxで内容変更時 Data、日時更新時 Metadata
        let paths: Vec<_> = ev.paths.iter().collect();
        if paths.len() != 1 {
            self.ui_all_refresh()?
        } else {
            // 1ファイルが変更されたときのみ、1ファイルのメタデータ再取得をする
            // ※ それ以外はディレクトリ再読み込み
            let filenames = paths
                .first()
                .iter()
                .flat_map(|p| p.file_name())
                .collect::<Vec<_>>();
            for filename in filenames {
                if let Ok(tab) = self.state.get_tab(self.tab_id) {
                    let mut tab = tab.write().unwrap();
                    if let Some(file_id) = tab.handle_modify_file(filename) {
                        self.ui_1file_refresh(file_id)?
                    }
                }
            }
        }
        Ok(())
    }

    fn ui_all_refresh(&self) -> anyhow::Result<()> {
        file_notify_tab(&self.app, self.tab_id)
    }
    fn ui_1file_refresh(&self, file_id: FileId) -> anyhow::Result<()> {
        file_notify_1file(&self.app, self.tab_id, file_id)
    }
}

fn paths_str(paths: &[PathBuf]) -> String {
    paths
        .iter()
        .map(|p| p.to_string_lossy())
        .collect::<Vec<_>>()
        .join(", ")
}

pub fn file_notify_tab<E: EventEmitter>(app: &AppContext<E>, tab_id: TabId) -> anyhow::Result<()> {
    file_notify_impl(app, tab_id, None)
}
pub fn file_notify_1file<E: EventEmitter>(
    app: &AppContext<E>,
    tab_id: TabId,
    file_id: FileId,
) -> anyhow::Result<()> {
    file_notify_impl(app, tab_id, Some(file_id))
}

fn file_notify_impl<E: EventEmitter>(
    app: &AppContext<E>,
    tab_id: TabId,
    file_id: Option<FileId>,
) -> anyhow::Result<()> {
    app.emit(EVENT_ID_FILE_NOTIFY, FileNotifyEvent { tab_id, file_id })
}
