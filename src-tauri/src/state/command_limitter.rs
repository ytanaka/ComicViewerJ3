use std::{
    cmp::max,
    sync::{Arc, Mutex},
};

/// Rustコマンドの同時実行数を制限する
pub struct CommandLimitter {
    state: Arc<Mutex<State>>,
}

struct State {
    max: u32,
    acquired: u32,
}

pub struct Permit {
    state: Arc<Mutex<State>>,
    released: bool,
}

impl CommandLimitter {
    pub fn new(limit: u32) -> Self {
        Self {
            state: Arc::new(Mutex::new(State {
                max: limit,
                acquired: 0,
            })),
        }
    }

    pub fn set_limit(&self, new_limit: u32) {
        let mut st = self.state.lock().unwrap();
        st.max = max(1, new_limit);
    }

    pub fn try_acquire(&self) -> Option<Permit> {
        let mut st = self.state.lock().unwrap();
        if st.max <= st.acquired {
            None
        } else {
            st.acquired += 1;
            Some(Permit {
                state: self.state.clone(),
                released: false,
            })
        }
    }
}

impl Drop for Permit {
    fn drop(&mut self) {
        if self.released {
            return;
        }
        let mut st = self.state.lock().unwrap();
        st.acquired -= 1;
        self.released = true;
    }
}
