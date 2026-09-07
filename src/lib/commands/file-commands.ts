import { useTabStore } from '@/store/tab/store';
import { DirEntry, logResult, rustcmds } from '../bindings-wrapper';
import { logErr } from '../log';

function st() {
  return useTabStore.getState();
}

export const fileCommands = {
  // 親ディレクトリへ移動
  async moveToParentDir() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const result = await rustcmds.cloneTabParentDir(tab.info.id);
    logResult(`rustcmds.cloneTabParentDir(${tab.info.id})`, result);
    if (result.status === 'error') {
      logErr(result);
    } else {
      st().updateTab(tab.info.id, result.data);
    }
  },

  // 子ディレクトリに移動
  async moveToChildDirectory(dirEntry: DirEntry) {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const result = await rustcmds.cloneTabChildDir(tab.info.id, dirEntry.file_id);
    logResult(`rustcmds.cloneTabChildDir(${tab.info.id},${dirEntry.file_id})`, result);
    if (result.status === 'error') {
      logErr(result);
    } else {
      st().updateTab(tab.info.id, result.data);
    }
  },
};
