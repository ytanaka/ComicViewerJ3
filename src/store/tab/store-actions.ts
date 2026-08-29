import { TabStore } from './store';
import { FileFocusHistory, FileId, FileInfoWrapper, FileSelection, mkFileSelection, TabId, TabInfo } from './types';

export interface TabStoreActions {
  setCurrentTabIndex: (index: number) => void;

  getTab: (tabId: TabId) => TabInfo;
  getCurrentTab: () => TabInfo;
  initTabs: (tabs: TabInfo[], focusHistories: Record<number, FileFocusHistory>) => void;

  addTab: (tab: TabInfo) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  removeTab: (tabId: TabId) => void;
}

export const createAllTabsActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore
): TabStoreActions => ({
  setCurrentTabIndex: (index: number) => {
    set(state => {
      if (index < 0 || (index !== 0 && state.tabs.length <= index))
        throw Error(`setCurrentTabIndex(): invalid tab index: ${index}`);
      return { currentTabIndex: index };
    });
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

  // TabStateInitializer から使う
  initTabs: (tabs: TabInfo[], focusHistories: Record<number, FileFocusHistory>) => {
    set(() => {
      const fileInfos: Record<TabId, Record<FileId, FileInfoWrapper>> = {};
      tabs.forEach(t => {
        fileInfos[t.id] = {};
      });

      const selections: Record<TabId, FileSelection> = {};
      tabs.forEach(t => {
        selections[t.id] = mkFileSelection();
      });

      return {
        tabs: [...tabs],
        fileInfos,
        selections,
        focusHistories: { ...focusHistories },
      };
    });
  },

  // ※ カレントタブは追加されたタブに移る
  addTab: tab => {
    set(state => {
      if (0 <= state.tabs.findIndex(t => t.id === tab.id)) throw Error(`addTab(): dup tab.id: ${tab.id}`);
      return {
        tabs: [...state.tabs, tab],
        currentTabIndex: state.tabs.length,
        fileInfos: { ...state.fileInfos, [tab.id]: {} },
        selections: { ...state.selections, [tab.id]: mkFileSelection() },
        focusHistories: { ...state.focusHistories, [tab.id]: { hist: [] } },
      };
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
    set(state => {
      const newList = state.tabs.filter(t => t.id !== tab.id);
      delete state.fileInfos[tabId];
      delete state.selections[tabId];
      delete state.focusHistories[tabId];

      // 最後のタブが削除されたら、左側のタブをカレントにする
      return {
        currentTabIndex: Math.max(0, Math.min(state.currentTabIndex, newList.length - 1)),
        tabs: newList,
        fileInfo: state.fileInfos,
        selections: state.selections,
        focusHistories: state.focusHistories,
      };
    });
  },
});
