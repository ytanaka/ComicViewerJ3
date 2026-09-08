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

use crate::{state::app_state::AppState, types::TabId};

pub struct FileWatcher {
    debouncer: Option<Debouncer<ReadDirectoryChangesWatcher, FileIdMap>>,
}
struct FileWatcherHandler {
    state: Arc<AppState>,
    tab_id: TabId,
    path: PathBuf,
}
impl FileWatcherHandler {
    fn handle_events(&self, ev: Result<Vec<DebouncedEvent>, Vec<notify::Error>>) {
        match ev {
            Ok(events) => {
                events.into_iter().for_each(|e| {
                    self.handle_event(e);
                });
            }
            Err(errors) => {
                // 何をしていいのかわからないので、ログを出しておく
                errors.iter().for_each(|e| log::error!("{}", e));
            }
        }
    }
    fn handle_event(&self, ev: DebouncedEvent) {
        match ev.kind {
            Create(_) => {
                ev.paths.iter().for_each(|path| {
                    log::trace!("Create: {:?}", path);
                });
            }
            Modify(kind) => {
                log::trace!("{:?}", ev);
                ev.paths.iter().for_each(|path| {
                    log::trace!("Modify({:?}): {:?}", kind, path);
                });
            }
            Remove(_) => {
                ev.paths.iter().for_each(|path| {
                    log::trace!("Remove: {:?}", path);
                });
            }
            ev => {
                log::trace!("UNKNOWN DebouncedEvent: {:?}", ev)
            }
        }
    }
}

impl FileWatcher {
    pub fn new(
        state: &Arc<AppState>,
        tab_id: TabId,
        path: impl AsRef<Path>,
    ) -> anyhow::Result<Self> {
        let handler = FileWatcherHandler {
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
