import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { useTabStore } from '@/store/tab/store';
import { mkUiTab, TabId } from '@/store/tab/types';
import { handleRustCmdResult, RustCmdResult, rustcmds, TabInfo } from '../bindings-wrapper';
import { removeQueries_tab } from '@/services/files';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';
import { useUiStore } from '@/store/ui-store';
import { toast } from 'sonner';

function st() {
  return useTabStore.getState();
}

async function _addTab(result: RustCmdResult<TabInfo>) {
  handleRustCmdResult(result, 'rustcmds.create_clene_Tab(...)', 'タブ追加失敗', data => {
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
      await this.addTab_homeDir();
    } else {
      _addTab(await rustcmds.cloneTab(currentTab.info.id));
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
      useScrollToFocusStore.getState().setScroll(true);
    });
  },

  // タブ削除 (カレント)
  async removeCurrentTab() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    await this.removeTab(tab.info.id);
  },

  // フォーカスするタブの指定
  setCurrentTabIndex(index: number) {
    st().setCurrentTabIndex(index);
    useScrollToFocusStore.getState().setScroll(true);
  },

  // フォーカスするタブを移動
  setCurrentTabNextPrev(inc: number) {
    let index = st().currentTabIndex + inc;
    if (index < 0) index = st().tabs.length - 1;
    else if (st().tabs.length <= index) index = 0;
    this.setCurrentTabIndex(index);
  },
};
