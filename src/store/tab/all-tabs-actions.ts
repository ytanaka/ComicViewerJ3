import { TabStore } from "./store";
import { TabId, TabInfo } from "./types";

export interface AllTabsActions {
  setCurrentTabIndex: (index: number) => void;

  getTab: (tabId: TabId) => TabInfo;
  getCurrentTab: () => TabInfo;
  setTabs: (tabs: TabInfo[]) => void;

  addTab: (tab: TabInfo) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  removeTab: (tabId: TabId) => void;
}

export const createAllTabsActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore,
): AllTabsActions => ({
  setCurrentTabIndex: (index: number) => {
    set((state) => {
      if (index < 0 || (index !== 0 && state.tabs.length <= index))
        throw Error(`setCurrentTabIndex(): invalid tab index: ${index}`);
      return { currentTabIndex: index };
    })
  },

  getTab: (tabId: TabId) => {
    const ret = get().tabs.find(t => t.id === tabId);
    if (!ret) throw new Error(`no tab(${tabId})`);
    return ret;
  },

  getCurrentTab: (): TabInfo => {
    const { tabs, currentTabIndex } = get();
    if (!tabs[currentTabIndex]) throw new Error(`no tab`);
    return tabs[currentTabIndex];
  },

  setTabs: (tabs: TabInfo[]) => {
    set(() => {
      return { tabs: [...tabs] }
    })
  },

  // ※ カレントタブは追加されたタブに移る
  addTab: tab => {
    set(state => {
      if (0 <= state.tabs.findIndex(t => t.id === tab.id)) throw Error(`addTab(): dup tab.id: ${tab.id}`);
      return { tabs: [...state.tabs, tab], currentTabIndex: state.tabs.length };
    });
  },

  moveTab: (fromIndex: number, toIndex: number) => {
    set(state => {
      if (state.tabs.length === 0) throw Error(`moveTab(): empty tabs`);
      if (fromIndex < 0 || state.tabs.length <= fromIndex || toIndex < 0 || state.tabs.length <= toIndex)
        throw Error(`moveTab(): invalid index: ${fromIndex},${toIndex} tabs.length = ${state.tabs.length}`);
      if (fromIndex === toIndex) return state;

      // 新しいカレントタブIndex
      let tIndex = state.currentTabIndex;
      if (fromIndex === tIndex) {
        tIndex = toIndex;
      } else {
        if (fromIndex < tIndex) {
          tIndex -= 1;
        }
        if (toIndex <= tIndex) {
          tIndex += 1;
        }
      }

      const newList = [...state.tabs];
      const [removed] = newList.splice(fromIndex, 1); // 1つ削除
      newList.splice(toIndex, 0, removed); // 1つ追加
      return { tabs: newList, currentTabIndex: tIndex };
    });
  },

  // ※ カレントタブが削除されたら、カレントは右のタブに移る
  removeTab: (tabId: TabId) => {
    const tab = get().getTab(tabId);
    set(prev => {
      const newList = prev.tabs.filter(t => t.id !== tab.id);

      // 最後のタブが削除されたら、左側のタブをカレントにする
      return { tabs: newList, currentTabIndex: Math.max(0, Math.min(prev.currentTabIndex, newList.length - 1)) };
    });
  },
});