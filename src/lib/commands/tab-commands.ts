import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { useTabStore } from '@/store/tab/store';
import { mkUiTab, TabId } from '@/store/tab/types';
import { rustcmds, TabInfo } from '../bindings-wrapper';
import { removeQueries_tab } from '@/services/files';

function st() {
  return useTabStore.getState();
}

async function _addTab(cmdResult: { status: "error"; error: string; } | { status: "ok"; data: TabInfo; }) {
  if (cmdResult.status === 'error') {
    // TODO
  } else {
    st().addTab(mkUiTab(cmdResult.data));
  }
}

export const tabCommands = {
  // タブを開く (ホームディレクトリ)
  async addTab_homeDir() {
    _addTab(await rustcmds.createTab(await tauri_homeDir()));
  },

  // タブを開く (現在のタブと同じディレクトリ)
  async cloneCurrentTab() {
    const currentTab = st().getCurrentTab();
    if (!currentTab) {
      await this.addTab_homeDir();
    } else {
      _addTab(await rustcmds.cloneTab(currentTab.info.id));
    }
  },

  // タブをコピーする
  // index を渡すと、インデックスにあるタブをコピーする
  // path を渡すと、そのパスでタブを開く
  async cloneTab(path: string) {
    if (20 <= st().tabs.length) return; // TODO
    const absPath = await tauri_path_resolve(path);
    _addTab(await rustcmds.createTab(absPath));
  },

  // タブ削除
  async removeTab(tabId: TabId) {
    console.info(`tabCommands.removeTab(${tabId})`);
    const result = await rustcmds.removeTab(tabId);
    if (result.status === 'error') {
      // TODO
    } else {
      st().removeTab(tabId);
      removeQueries_tab(tabId);
    }
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
  },

  // フォーカスするタブを移動
  setCurrentTabNextPrev(inc: number) {
    let index = st().currentTabIndex + inc;
    if (index < 0) index = st().tabs.length - 1;
    else if (st().tabs.length <= index) index = 0;
    this.setCurrentTabIndex(index);
  },
};
