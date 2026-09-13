import { useTabStore } from '@/store/tab/store';
import {
  DirEntry,
  handleRustCmdCreateTabResult,
  handleRustCmdResult,
  RustCmdResult,
  rustcmds,
  TabInfo,
} from '../bindings-wrapper';
import { removeQueries_tab } from '@/services/tab';
import { CreateTabError, Either } from '../bindings';

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
    });
  },

  // 子ディレクトリに移動
  async moveToChildDirectory(dirEntry: DirEntry) {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const comment = `rustcmds.cloneTabChildDir(${tab.info.id},${dirEntry.file_id})`;
    _moveDir(tab.info, comment, () => {
      return rustcmds.cloneTabChildDir(tab.info.id, dirEntry.file_id);
    });
  },
};

async function _moveDir(
  tab: TabInfo,
  comment: string,
  createNewTabFn: () => Promise<RustCmdResult<Either<CreateTabError, TabInfo>>>
) {
  const result = await createNewTabFn();
  handleRustCmdCreateTabResult(result, comment, 'ディレクトリ移動できません', async data => {
    st().updateTab(tab.id, data);
    removeQueries_tab(tab.id);
    const result = await rustcmds.removeTab(tab.id);
    handleRustCmdResult(result, `rustcmds.removeTab(${tab.id})`, 'タブ更新失敗');
  });
}
