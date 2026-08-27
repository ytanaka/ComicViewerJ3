import { useTabState } from '@/store/tab-state';
import { resolve as tauri_resolve, dirname as tauri_dirname } from '@tauri-apps/api/path';

function st() {
  return useTabState.getState();
}

export const fileCommands = {
  async moveToParentDir() {
    const tab = st().getCurrentTab();
    if (!tab) return;

    try {
      const parent = await tauri_dirname(tab.files.getPath());
      this.movePath(parent);
    } catch (e) {
      console.warn(`fileCommands.moveParentDir(): current = ${tab.files.getPath()}, error = ${e}`);
      return;
    }
  },

  async moveToChildDirectory(name: string) {
    const tab = st().getCurrentTab();
    if (!tab) return;

    const dir = await tauri_resolve(tab.files.getPath(), name);
    this.movePath(dir);
  },

  movePath(path: string) {
    useTabState.getState().updateCurrentTab(tab => {
      tab.files.clear(path);
    });
  },
};
