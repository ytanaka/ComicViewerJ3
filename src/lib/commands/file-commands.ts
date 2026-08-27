import { mkCurrentTabFilesOp } from '@/store/tab-files';
import { resolve as tauri_resolve, dirname as tauri_dirname } from '@tauri-apps/api/path';

export const fileCommands = {
  async moveToParentDir() {
    const tabFiles = mkCurrentTabFilesOp();
    try {
      const parent = await tauri_dirname(tabFiles.getPath());
      this.movePath(parent);
    } catch (e) {
      console.warn(`fileCommands.moveParentDir(): current = ${tabFiles.getPath()}, error = ${e}`);
      return;
    }
  },

  async moveToChildDirectory(name: string) {
    const tabFiles = mkCurrentTabFilesOp();
    const dir = await tauri_resolve(tabFiles.getPath(), name);
    this.movePath(dir);
  },

  movePath(path: string) {
    const tabFiles = mkCurrentTabFilesOp();
    tabFiles.setNewPath(path);
  },
};
