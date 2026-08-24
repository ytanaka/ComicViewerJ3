import { homeDir } from "@tauri-apps/api/path";
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { useTabState } from "@/store/tab-state";
import { ListFiles } from "../list-files";
import { commands } from "../bindings";

function st() {
  return useTabState.getState()
}

export const tabCommands = {
  async addTab() {
    await this.cloneTab();
  },

  async cloneCurrentTab() {
    await this.cloneTab(st().currentTabIndex);
  },

  async cloneTab(index?: number) {
    if (10 <= st().tabs.length) return;

    const tabId = await commands.createTab();
    const path = index !== undefined ? st().tabs[index].path : await homeDir();
    const absPath = await tauri_path_resolve(path);
    st().addTab({ id: tabId, path: absPath, list: new ListFiles() });
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
  }
}
