/// 単体テストで tauri::* の型を参照すると(間接的でも)Windowsで以下のエラーになる
///
/// error: test failed, to rerun pass `--lib`
///
/// Caused by:
///   process didn't exit successfully: `C:\ComicViewerJ3\src-tauri\target\debug\deps\comicviewerj3_lib-ff02ba61011af069.exe` (exit code: 0xc0000139, STATUS_ENTRYPOINT_NOT_FOUND)
/// note: test exited abnormally; to see the full output pass --no-capture to the harness.
/// [ELIFECYCLE] Command failed with exit code 3221225785.
///
/// tauri::AppHndle を単体テストから見えないようにするために、AppHandle をラップして AppContext を使うようにする
///
use serde::Serialize;
use tauri::{AppHandle, Emitter};

// ---------------------------------------------------------------------------------------------------------------------
// AppHandle.emit() と同じインターフェイスを持つ trait
pub trait EventEmitter: Send + Sync + 'static {
    fn emit_payload<S: Serialize + Clone + Send + 'static>(
        &self,
        event: &str,
        payload: S,
    ) -> anyhow::Result<()>;

    // 単体テスト環境では true になる
    fn is_dummy(&self) -> bool;
}

// アプリ実行時は本物の AppHandle を trait の実体として使う
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

// 単体テスト時はAppHandleの代わりにこれを使う
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

// ---------------------------------------------------------------------------------------------------------------------
// AppHandle のラッパー
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
