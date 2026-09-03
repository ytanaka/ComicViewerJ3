import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { commands } from '../bindings';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';
import { useTabStore } from '@/store/tab/store';
import { mkTabInfo, TabId } from '@/store/tab/types';
import { rustcmd } from '../bindings-wrapper';

function st() {
  return useTabStore.getState();
}

export const tabCommands = {
  // タブを開く (ホームディレクトリ)
  async addTab_homeDir() {
    await this.cloneTab(await tauri_homeDir());
  },

  // タブを開く (現在のタブと同じディレクトリ)
  async cloneCurrentTab() {
    if (st().tabs.length === 0) {
      await this.addTab_homeDir();
    } else {
      await this.cloneTab(st().currentTabIndex);
    }
  },

  // タブをコピーする
  // index を渡すと、インデックスにあるタブをコピーする
  // path を渡すと、そのパスでタブを開く
  async cloneTab(index_or_path: number | string) {
    if (20 <= st().tabs.length) return;

    let path: string;
    if (typeof index_or_path === 'string') {
      path = index_or_path;
    } else if (typeof index_or_path === 'number') {
      path = st().tabs[index_or_path].path;
    } else {
      path = await tauri_homeDir();
    }
    const absPath = await tauri_path_resolve(path);
    const tabId = await rustcmd.createTab();
    st().addTab(mkTabInfo(tabId, absPath));
  },

  // タブ削除
  async removeTab(id: TabId) {
    if (st().tabs.length === 0) return;
    console.info(`tabCommands.removeTab(${id})`);
    st().removeTab(id);
    await commands.removeTab(id);
    useScrollToFocusStore.getState().setScroll(true);
  },

  // タブ削除 (カレント)
  async removeCurrentTab() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    await this.removeTab(tab.id);
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
