import { useTabStore } from '@/store/tab/store';
import { DirEntry, rustcmds } from '../bindings-wrapper';

function st() {
  return useTabStore.getState();
}

export const fileCommands = {
  // 親ディレクトリへ移動
  async moveToParentDir() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const result = await rustcmds.cloneTabParentDir(tab.info.id);
    if (result.status === 'error') {
      // TODO
    } else {
      st().updateTab(tab.info.id, result.data);
    }
  },

  // 子ディレクトリに移動
  async moveToChildDirectory(dirEntry: DirEntry) {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const result = await rustcmds.cloneTabChildDir(tab.info.id, dirEntry.file_id);
    if (result.status === 'error') {
      // TODO
    } else {
      st().updateTab(tab.info.id, result.data);
    }
  },
};
