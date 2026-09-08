use std::{
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

use notify::{
    EventKind::{Create, Modify, Remove},
    ReadDirectoryChangesWatcher, RecursiveMode,
};
use notify_debouncer_full::{new_debouncer, DebouncedEvent, Debouncer, FileIdMap};
use tauri::{AppHandle, Emitter};

use crate::{
    state::app_state::AppState,
    types::{FileNotifyEvent, TabId, EVENT_ID_FILE_NOTIFY},
};

// ---------------------------------------------------------------------------------------------------------------------
pub struct FileWatcher {
    debouncer: Option<Debouncer<ReadDirectoryChangesWatcher, FileIdMap>>,
}
impl FileWatcher {
    pub fn new(
        app: &AppHandle,
        state: &Arc<AppState>,
        tab_id: TabId,
        path: impl AsRef<Path>,
    ) -> anyhow::Result<Self> {
        let handler = FileWatcherHandler {
            app: app.clone(),
            state: state.clone(),
            tab_id,
            path: path.as_ref().to_path_buf(),
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
struct FileWatcherHandler {
    app: AppHandle,
    state: Arc<AppState>,
    tab_id: TabId,
    path: PathBuf,
}
impl FileWatcherHandler {
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
        match ev.kind {
            Create(_) => {
                for path in &ev.paths {
                    log::trace!("FileWatcher Create: (tab:{}) {:?}", self.tab_id, path);
                    self.emit_all()?
                }
            }
            Modify(kind) => {
                log::trace!("{:?}", ev);
                for path in &ev.paths {
                    log::trace!("FileWatcher Modify({:?}): {:?}", kind, path);
                    self.emit_all()?
                }
            }
            Remove(_) => {
                for path in &ev.paths {
                    log::trace!("FileWatcher Remove: {:?}", path);
                    self.emit_all()?
                }
            }
            ev => {
                log::warn!("UNKNOWN DebouncedEvent: {:?}", ev);
            }
        };
        Ok(())
    }
    fn emit_all(&self) -> anyhow::Result<()> {
        Ok(self.app.emit(
            EVENT_ID_FILE_NOTIFY,
            FileNotifyEvent {
                tab_id: self.tab_id,
                file_id: None,
            },
        )?)
    }
}
