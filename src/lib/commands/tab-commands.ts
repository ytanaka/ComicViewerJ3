import { homeDir as tauri_homeDir } from '@tauri-apps/api/path';
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { useTabState } from '@/store/tab-state';
import { TabFiles } from '@/store/tab-files';
import { commands } from '../bindings';

function st() {
  return useTabState.getState();
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
      path = st().tabs[index_or_path].path
    } else {
      path = await tauri_homeDir();
    }
    const absPath = await tauri_path_resolve(path);
    const tabId = await commands.createTab();
    st().addTab({ id: tabId, path: absPath, files: new TabFiles() });
  },

  async removeTab(index: number) {
    if (st().tabs.length === 0) return;
    console.info(`tabCommands.removeTab(${index})`);
    const removedId = st().removeTab(index);
    await commands.removeTab(removedId);
  },

  async removeCurrentTab() {
    if (st().tabs.length === 0) return;
    await this.removeTab(st().currentTabIndex);
  },

  setCurrentTabIndex(index: number) {
    st().setCurrentTabIndex(index);
  },

  setCurrentTabNextPrev(inc: number) {
    let index = st().currentTabIndex + inc;
    if (index < 0) index = st().tabs.length - 1;
    else if (st().tabs.length <= index) index = 0;
    this.setCurrentTabIndex(index);
  },
};
