import { useTabStore } from '@/store/tab/store';
import { DirEntry, logResult, RustCmdResult, rustcmds, TabInfo } from '../bindings-wrapper';
import { logErr } from '../log';
import { removeQueries_tab } from '@/services/files';

function st() {
  return useTabStore.getState();
}

export const fileCommands = {
  // 親ディレクトリへ移動
  async moveToParentDir() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const comment = `rustcmds.cloneTabParentDir(${tab.info.id})`;
    _moveDir(tab.info, comment, () => {
      return rustcmds.cloneTabParentDir(tab.info.id);
    })

  },

  // 子ディレクトリに移動
  async moveToChildDirectory(dirEntry: DirEntry) {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const comment = `rustcmds.cloneTabChildDir(${tab.info.id},${dirEntry.file_id})`;
    _moveDir(tab.info, comment, () => {
      return rustcmds.cloneTabChildDir(tab.info.id, dirEntry.file_id);
    })
  },
};

async function _moveDir(tab: TabInfo, comment: string, createNewTabFn: () => Promise<RustCmdResult<TabInfo>>) {
  const result = await createNewTabFn();
  logResult(comment, result);
  if (result.status === 'error') {
    logErr(result);
  } else {
    st().updateTab(tab.id, result.data);
    removeQueries_tab(tab.id);
    await _rmTab(tab);
  }
}
async function _rmTab(tab: TabInfo) {
  const result = await rustcmds.removeTab(tab.id);
  logResult(`rustcmds.removeTab(${tab.id})`, result);
  if (result.status === 'error') {
    logErr(result);
  }
}
