import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { commands } from '../bindings';
import { useScrollToFocusState } from '@/store/scroll-to-focus-state';
import { useTabStore } from '@/store/tab/store';
import { mkTabInfo, TabId } from '@/store/tab/types';

function st() {
  return useTabStore.getState();
}

export const tabCommands = {
  async addTab() {
    await this.cloneTab();
  },

  async cloneCurrentTab() {
    await this.cloneTab(st().currentTabIndex);
  },

  async cloneTab(index_or_path?: number | string) {
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
    const tabId = await commands.createTab();
    st().addTab(mkTabInfo(tabId, absPath));
  },

  async removeTab(id: TabId) {
    if (st().tabs.length === 0) return;
    console.info(`tabCommands.removeTab(${id})`);
    st().removeTab(id);
    await commands.removeTab(id);
    useScrollToFocusState.getState().setScroll(true);
  },

  async removeCurrentTab() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    await this.removeTab(tab.id);
  },

  setCurrentTabIndex(index: number) {
    st().setCurrentTabIndex(index);
    useScrollToFocusState.getState().setScroll(true);
  },

  setCurrentTabNextPrev(inc: number) {
    let index = st().currentTabIndex + inc;
    if (index < 0) index = st().tabs.length - 1;
    else if (st().tabs.length <= index) index = 0;
    this.setCurrentTabIndex(index);
  },
};
