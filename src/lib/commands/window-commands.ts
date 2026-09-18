import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as tauri_open } from '@tauri-apps/plugin-dialog';
import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';

import { _checkMaxTabs, tabCommands } from './tab-commands';
import { useTabStore } from '@/store/tab/store';
import { rustcmds } from '../bindings-wrapper';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { toast } from 'sonner';

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
    if (!_checkMaxTabs()) return;
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

  async setFullscreen(b: boolean) {
    if (b === useUiVolatileStore.getState().isFullscreen) return;
    await rustcmds.setFullscreen(b);
    useUiVolatileStore.getState().setField('isFullscreen', b);
    useTabStore.getState().incGeneration();

    if (!useUiVolatileStore.getState().isFullscreenUsageShown) {
      toast.info('全画面表示切替は [F11]', {
        id: 'isFullscreenUsageShown',
        duration: 5000,
      });
      useUiVolatileStore.getState().setField('isFullscreenUsageShown', true);
    }
  },
};
