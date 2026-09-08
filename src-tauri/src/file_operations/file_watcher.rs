use std::{path::Path, sync::Arc, time::Duration};

use notify::{ReadDirectoryChangesWatcher, RecursiveMode};
use notify_debouncer_full::{new_debouncer, DebouncedEvent, Debouncer, FileIdMap};

use crate::{state::app_state::AppState, types::TabId};

pub struct FileWatcher {
    debouncer: Option<Debouncer<ReadDirectoryChangesWatcher, FileIdMap>>,
}

impl FileWatcher {
    pub fn new(
        state: &Arc<AppState>,
        tab_id: TabId,
        path: impl AsRef<Path>,
    ) -> anyhow::Result<Self> {
        let state2 = state.clone();
        let mut debouncer = new_debouncer(Duration::from_secs(1), None, move |ev| {
            handle_event(&state2, tab_id, ev)
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

fn handle_event(
    state: &Arc<AppState>,
    tabId: TabId,
    ev: Result<Vec<DebouncedEvent>, Vec<notify::Error>>,
) {
    match ev {
        Ok(events) => {
            events.iter().for_each(|e| {
                log::trace!("DebouncedEvent: {:?}", e);
            });
        }
        Err(errors) => {
            errors.iter().for_each(|e| log::error!("{}", e));
        }
    }
}
