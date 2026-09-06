import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as tauri_open } from '@tauri-apps/plugin-dialog';
import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';

import { tabCommands } from './tab-commands';
import { useTabStore } from '@/store/tab/store';
import { rustcmds } from '../bindings-wrapper';

export const windowCommands = {
  // アプリ終了
  async exitApp() {
    const window = getCurrentWindow();
    await window.close();
    await rustcmds.exitApp();
  },

  // ユーザーが選択したディレクトリで新しいタブを開く
  // ※ OSのダイアログを開いてユーザーに尋ねる
  async openDirectory() {
    let path = useTabStore.getState().getCurrentTab()?.info.path;
    if (!path) {
      path = await tauri_homeDir();
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
