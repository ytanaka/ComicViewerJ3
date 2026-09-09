use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Clone)]
pub struct AppContext {
    app: Option<AppHandle>,
}

impl AppContext {
    pub fn new(app: AppHandle) -> Self {
        AppContext { app: Some(app) }
    }
    #[cfg(test)]
    pub fn dummy() -> Self {
        AppContext { app: None }
    }

    pub fn emit<S: Serialize + Clone>(&self, event: &str, payload: S) -> tauri::Result<()> {
        match &self.app {
            Some(app) => app.emit(event, payload),
            None => Ok(()),
        }
    }
}
