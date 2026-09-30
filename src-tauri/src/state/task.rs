use std::sync::{Arc, RwLock};

use crate::types::FilePasteConfirmResponse;

pub struct AppTask {
    pub canceled: bool,
    pub copy_move_response: Option<FilePasteConfirmResponse>,
}
impl AppTask {
    pub fn new() -> Arc<RwLock<Self>> {
        Arc::new(RwLock::new(Self {
            canceled: false,
            copy_move_response: None,
        }))
    }
}
pub struct AppTaskWrapper {
    task: Option<Arc<RwLock<AppTask>>>,
}
impl AppTaskWrapper {
    pub fn new(task: Option<Arc<RwLock<AppTask>>>) -> Self {
        Self { task }
    }

    pub fn cancel_task(&mut self) {
        if let Some(t) = &self.task {
            t.write().unwrap().canceled = true;
        }
    }
    pub fn is_task_canceled(&self) -> bool {
        match &self.task {
            None => true,
            Some(t) => t.read().unwrap().canceled,
        }
    }

    pub fn set_response(&mut self, response: FilePasteConfirmResponse) {
        if let Some(t) = &self.task {
            t.write().unwrap().copy_move_response = Some(response);
        }
    }
}
