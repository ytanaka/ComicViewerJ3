use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub trait EventEmitter: Send + Sync + 'static {
    fn emit_payload<S: Serialize + Clone + Send + 'static>(
        &self,
        event: &str,
        payload: S,
    ) -> anyhow::Result<()>;

    // 単体テスト環境では true になる
    fn is_dummy(&self) -> bool;
}

impl EventEmitter for AppHandle {
    fn emit_payload<S: Serialize + Clone + Send + 'static>(
        &self,
        event: &str,
        payload: S,
    ) -> anyhow::Result<()> {
        Ok(self.emit(event, payload)?)
    }

    fn is_dummy(&self) -> bool {
        false
    }
}

#[cfg(test)]
pub struct DummyAppHandle {}
#[cfg(test)]
impl EventEmitter for DummyAppHandle {
    fn emit_payload<S: Serialize + Clone + Send + 'static>(
        &self,
        _event: &str,
        _payload: S,
    ) -> anyhow::Result<()> {
        Ok(())
    }

    fn is_dummy(&self) -> bool {
        true
    }
}

// --------------------------------------------------
// 構造体の定義：ジェネリクス E を保持する
// --------------------------------------------------
pub struct AppContext<E: EventEmitter> {
    emitter: E,
}

impl<E: EventEmitter> AppContext<E> {
    pub fn new(emitter: E) -> Self {
        Self { emitter }
    }

    pub fn emit<S: Serialize + Clone + Send + 'static>(
        &self,
        event: &str,
        payload: S,
    ) -> anyhow::Result<()> {
        self.emitter.emit_payload(event, payload)
    }

    pub fn is_dummy(&self) -> bool {
        self.emitter.is_dummy()
    }
}
