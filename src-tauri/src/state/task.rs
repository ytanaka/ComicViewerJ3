use std::{
    sync::{
        mpsc::{self, Receiver, Sender},
        Arc, RwLock,
    },
    time::{SystemTime, UNIX_EPOCH},
};

use tauri::AppHandle;

use crate::{
    state::app_state::AppState,
    types::{TabId, TaskId, TaskResponse},
};

pub struct AppTask {
    pub task_id: TaskId,
    pub canceled: bool,
    pub tx: Sender<TaskResponse>,
}
impl AppTask {
    pub fn new(task_id: TaskId) -> (Receiver<TaskResponse>, Arc<RwLock<Self>>) {
        let (tx, rx) = mpsc::channel::<TaskResponse>();
        let task = Arc::new(RwLock::new(Self {
            task_id,
            canceled: false,
            tx,
        }));
        (rx, task)
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
            let mut t = t.write().unwrap();
            t.canceled = true;
            t.tx.send(TaskResponse::new_dummy(t.task_id)).unwrap();
        }
    }
    pub fn is_task_canceled(&self) -> bool {
        match &self.task {
            None => true,
            Some(t) => t.read().unwrap().canceled,
        }
    }

    pub fn set_response(&mut self, response: TaskResponse) {
        if let Some(t) = &self.task {
            t.write().unwrap().tx.send(response).unwrap();
        }
    }
}

pub struct TaskContext<E, A> {
    pub app: AppHandle,
    pub state: Arc<AppState>,
    pub task_id: TaskId,
    pub task: Arc<RwLock<AppTask>>,
    pub tab_id: TabId,
    pub event: E,
    pub rx: Receiver<TaskResponse>,
    pub answer: Option<A>,

    event_emit_time_ms: u128,
}

impl<E, A> TaskContext<E, A> {
    pub fn new(
        app: AppHandle,
        state: Arc<AppState>,
        task_id: TaskId,
        tab_id: TabId,
        event: E,
    ) -> Self {
        let (rx, task) = state.add_task(task_id);
        Self {
            app,
            state,
            task_id,
            task,
            tab_id,
            event,
            rx,
            answer: None,
            event_emit_time_ms: 0,
        }
    }

    pub fn is_canceled(&self) -> bool {
        !self.state.has_tab(self.tab_id) || self.state.get_task(self.task_id).is_task_canceled()
    }

    pub fn can_emit_event(&self) -> anyhow::Result<bool> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis();
        Ok(100 < now - self.event_emit_time_ms)
    }

    pub fn cancel_task(&mut self) {
        self.state.get_task(self.task_id).cancel_task();
    }
}
