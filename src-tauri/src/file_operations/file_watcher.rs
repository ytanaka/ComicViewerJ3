use std::{
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

use notify::{EventKind, RecommendedWatcher, RecursiveMode};
use notify_debouncer_full::{DebouncedEvent, Debouncer, RecommendedCache, new_debouncer};

use crate::{
    state::{
        app_state::AppState,
        util::{AppContext, EventEmitter},
    },
    types::{FileId, FileNotifyEvent, TabId, EVENT_ID_FILE_NOTIFY},
};

// ---------------------------------------------------------------------------------------------------------------------
pub struct FileWatcher {
    debouncer: Option<Debouncer<RecommendedWatcher, RecommendedCache>>,
}
impl FileWatcher {
    pub fn new<E: EventEmitter>(
        app: AppContext<E>,
        state: &Arc<AppState>,
        tab_id: TabId,
        path: impl AsRef<Path>,
    ) -> anyhow::Result<Self> {
        if app.is_dummy() {
            return Ok(FileWatcher { debouncer: None });
        }

        let handler = FileWatcherHandler {
            app: app,
            state: state.clone(),
            tab_id,
        };
        let mut debouncer = new_debouncer(Duration::from_secs(1), None, move |ev| {
            handler.handle_events(ev);
        })?;

        debouncer.watch(path.as_ref(), RecursiveMode::NonRecursive)?;
        Ok(FileWatcher {
            debouncer: Some(debouncer),
        })
    }

    pub fn stop(&mut self) {
        if let Some(d) = self.debouncer.take() {
            d.stop_nonblocking();
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
    fn handle_events(&self, ev: Result<Vec<DebouncedEvent>, Vec<notify::Error>>) {
        match ev {
            Ok(events) => {
                events.into_iter().for_each(|e| {
                    if let Err(e) = self.handle_event(e) {
                        log::error!("FileWatcher error: {}", e);
                    }
                });
            }
            Err(errors) => {
                // 何をしていいのかわからないので、ログを出しておく
                errors.iter().for_each(|e| log::error!("{}", e));
            }
        }
    }
    fn handle_event(&self, ev: DebouncedEvent) -> anyhow::Result<()> {
        log::trace!(
            "FileWatcher {:?}: (tab:{}) {:?}",
            ev.kind,
            self.tab_id,
            paths_str(&ev.paths)
        );

        match ev.kind {
            EventKind::Create(_) => self.ui_all_refresh()?,
            EventKind::Remove(_) => self.ui_all_refresh()?,
            EventKind::Modify(_) => {
                let paths: Vec<_> = ev.paths.iter().collect();
                if paths.len() != 1 {
                    self.ui_all_refresh()?
                } else {
                    // 1ファイルが変更されたときのみ、1ファイルのメタデータ再取得をする
                    // ※ それ以外はディレクトリ再読み込み
                    let filenames = &&paths
                        .first()
                        .iter()
                        .flat_map(|p| p.file_name())
                        .collect::<Vec<_>>();
                    for filename in *filenames {
                        let tab = self.state.get_tab(self.tab_id).unwrap();
                        let mut tab = tab.write().unwrap();
                        if let Some(file_id) = tab.handle_modify_file(filename) {
                            self.ui_1file_refresh(file_id)?
                        }
                    }
                }
            }
            EventKind::Access(_) => { /* 無視する */},
            ev => {
                log::warn!("UNKNOWN DebouncedEvent: {:?}", ev);
                self.ui_all_refresh()?
            }
        };
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
    Ok(app.emit(
        EVENT_ID_FILE_NOTIFY,
        FileNotifyEvent {
            tab_id: tab_id,
            file_id: file_id,
        },
    )?)
}
