use std::{
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

use notify::{EventKind, ReadDirectoryChangesWatcher, RecursiveMode};
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
        log::trace!(
            "FileWatcher {:?}: (tab:{}) {:?}",
            ev.kind,
            self.tab_id,
            paths_str(&ev.paths)
        );

        match ev.kind {
            EventKind::Create(_) => self.emit_all()?,
            EventKind::Remove(_) => self.emit_all()?,
            EventKind::Modify(_) => {
                let paths: Vec<_> = ev.paths.iter().collect();
                if paths.len() == 1 {
                    self.emit_all()?
                } else {
                    self.emit_all()?
                }
            }
            ev => {
                log::warn!("UNKNOWN DebouncedEvent: {:?}", ev);
                self.emit_all()?
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

fn paths_str(paths: &Vec<PathBuf>) -> String {
    paths
        .iter()
        .map(|p| p.to_string_lossy())
        .collect::<Vec<_>>()
        .join(", ")
}
