import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as tauri_open } from '@tauri-apps/plugin-dialog';
import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';

import { commands } from '../bindings';
import { tabCommands } from './tab-commands';
import { useTabStore } from '@/store/tab/store';

export const windowCommands = {
  // アプリ終了
  async exitApp() {
    const window = getCurrentWindow();
    await window.close();
    await commands.exitApp();
  },

  // ユーザーが選択したディレクトリで新しいタブを開く
  // ※ OSのダイアログを開いてユーザーに尋ねる
  async openDirectory() {
    let path: string;
    if (useTabStore.getState().tabs.length === 0) {
      path = await tauri_homeDir();
    } else {
      path = useTabStore.getState().getCurrentTab().path;
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
