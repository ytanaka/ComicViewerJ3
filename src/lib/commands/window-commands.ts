import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as tauri_open } from '@tauri-apps/plugin-dialog';
import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';

import { commands } from '../bindings';
import { useTabState } from '@/store/tab-state';
import { tabCommands } from './tab-commands';

export const windowCommands = {
  async exitApp() {
    const window = getCurrentWindow();
    await window.close();
    await commands.exitApp();
  },

  async openDirectory() {
    let path: string;
    if (useTabState.getState().tabs.length === 0) {
      path = await tauri_homeDir();
    } else {
      const tab = useTabState.getState().getCurrentTab();
      path = tab.files.getPath();
    }

    const dir = await tauri_open({
      directory: true,
      multiple: false,
      defaultPath: path,
    });
    if (typeof dir !== 'string') return;

    tabCommands.cloneTab(dir);
  },
};
