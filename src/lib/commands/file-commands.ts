import { useTabStore } from '@/store/tab/store';
import { resolve as tauri_resolve, dirname as tauri_dirname } from '@tauri-apps/api/path';
import { errToStr } from '../string-util';

function st() {
  return useTabStore.getState();
}

export const fileCommands = {
  async moveToParentDir() {
    const path = st().getCurrentTab().path;
    try {
      const parent = await tauri_dirname(path);
      this.movePath(parent);
    } catch (e) {
      console.debug(`fileCommands.moveParentDir(): current = ${path}, error = ${errToStr(e)}`);
      return;
    }
  },

  async moveToChildDirectory(name: string) {
    const path = st().getCurrentTab().path;
    const dir = await tauri_resolve(path, name);
    this.movePath(dir);
  },

  movePath(path: string) {
    st().setPath(st().getCurrentTab().id, path);
  },
};
