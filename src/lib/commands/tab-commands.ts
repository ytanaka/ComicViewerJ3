import { toast } from 'sonner';
import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { useTabStore } from '@/store/tab/store';
import { mkUiTab } from '@/store/tab/types';
import {
  DirEntry,
  handleRustCmdCreateTabResult,
  handleRustCmdResult,
  RustCmdResult,
  rustcmds,
  TabId,
  TabInfo,
} from '../bindings-wrapper';
import { removeQueries_tab } from '@/services/tab';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';
import { useUiStore } from '@/store/ui-store';
import { CreateTabError, Either } from '../bindings';

function st() {
  return useTabStore.getState();
}

async function _addTab(result: RustCmdResult<Either<CreateTabError, TabInfo>>) {
  return handleRustCmdCreateTabResult(result, 'rustcmds.create_clene_Tab(...)', 'タブ追加失敗', data => {
    st().addTab(mkUiTab(data));
  });
}
export function _checkMaxTabs() {
  const max = useUiStore.getState().maxTabNum;
  if (max <= st().tabs.length) {
    toast(`最大タブ数(${max}): 設定画面で変更可能です`, { id: 'max-tabs-alert' });
    return false;
  }
  return true;
}

export const tabCommands = {
  // タブを開く (ホームディレクトリ)
  async addTab_homeDir() {
    if (!_checkMaxTabs()) return;
    _addTab(await rustcmds.createTab(await tauri_homeDir()));
  },

  // タブを開く (現在のタブと同じディレクトリ)
  async cloneCurrentTab() {
    if (!_checkMaxTabs()) return;
    const currentTab = st().getCurrentTab();
    if (!currentTab) {
      await tabCommands.addTab_homeDir();
    } else {
      if (await _addTab(await rustcmds.cloneTab(currentTab.info.id))) {
        const newTab = st().getCurrentTab();
        if (newTab) {
          st().setViewMode(newTab.info.id, currentTab.fileViewMode);
          st().setThumbnailSize(newTab.info.id, currentTab.thumbnailSize);
        }
      }
    }
  },

  // タブを開く (指定パスで)
  async cloneTab(path: string) {
    if (!_checkMaxTabs()) return;
    const absPath = await tauri_path_resolve(path);
    _addTab(await rustcmds.createTab(absPath));
  },

  // タブ削除
  async removeTab(tabId: TabId) {
    console.info(`tabCommands.removeTab(${tabId})`);
    const result = await rustcmds.removeTab(tabId);
    handleRustCmdResult(result, `rustcmds.removeTab(${tabId})`, 'タブ削除失敗', () => {
      st().removeTab(tabId);
      removeQueries_tab(tabId);
      useScrollToFocusStore.getState().setNeedScroll(true);
    });
  },

  // タブ削除 (カレント)
  async removeCurrentTab() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    await tabCommands.removeTab(tab.info.id);
  },

  // フォーカスするタブの指定
  setCurrentTabIndex(index: number) {
    st().setCurrentTabIndex(index);
    useScrollToFocusStore.getState().setNeedScroll(true);
  },

  // フォーカスするタブを移動
  setCurrentTabNextPrev(inc: number) {
    let index = st().currentTabIndex + inc;
    if (index < 0) index = st().tabs.length - 1;
    else if (st().tabs.length <= index) index = 0;
    tabCommands.setCurrentTabIndex(index);
  },

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

  // 次、前のディレクトリに移動
  async moveToPrevNextDirectory(move: number) {
    const tab = st().getCurrentTab();
    if (!tab) return;
    const comment = `rustcmds.cloneTabSiblingDir(${tab.info.id},${move})`;
    _moveDir(tab.info, comment, () => {
      return rustcmds.cloneTabSiblingDir(tab.info.id, 0 < move);
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
