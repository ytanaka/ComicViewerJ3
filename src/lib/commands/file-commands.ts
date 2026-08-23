import { TabInfo, useTabState } from "@/store/tab-state"
import { resolve as tauri_resolve, dirname as tauri_dirname } from "@tauri-apps/api/path";


function st() {
  return useTabState.getState()
}

export const fileCommands = {
  async moveParentDir() {
    const tab = st().getCurrentTab();
    if (!tab) return;

    try {
      const parent = await tauri_dirname(tab.path);
      this.movePath(tab, parent);
    } catch (e) {
      console.log(`moveParentDir(): current = ${tab.path}, error = ${e}`);
      return;
    }
  },

  async moveChildDirectory(name: string) {
    const tab = st().getCurrentTab();
    if (!tab) return;

    const dir = await tauri_resolve(tab.path, name);
    this.movePath(tab, dir);
  },

  movePath(tab: TabInfo, path: string) {
    tab.list.clearPath();
    tab.path = path;
    st().updateTab(st().currentTabIndex, tab);
  }
}