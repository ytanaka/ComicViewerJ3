import { mkDefaultSortCondition, TabId, TabInfo } from './types';
import { TabStore } from './store';
import { DirEntry } from '@/lib/bindings-wrapper';
import { SortCondition } from '@/lib/bindings';

export interface TabInfoActions {
  setPath: (tabId: TabId, path: string) => void;

  setDirEntries: (tabId: TabId, list: DirEntry[]) => void;
  setErrorMsg: (tabId: TabId, msg: string) => void;

  setSortCondition: (tabId: TabId, sortCondition: SortCondition) => void;
}

export const createTabInfoActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore
): TabInfoActions => {
  function updateTab(tabId: TabId, fn: (tab: TabInfo) => void) {
    set(state => {
      const tab = state.getTab(tabId);
      fn(tab);
      const newTabs = state.tabs.map(t => (t.id !== tab.id ? t : { ...tab }));
      return { tabs: newTabs };
    });
    return true;
  }

  return {
    setPath: (tabId: TabId, path: string) => {
      updateTab(tabId, tab => {
        tab.path = path;
        tab.sortCondition = mkDefaultSortCondition();
        tab.dirEntries = undefined;
        tab.errorMsg = undefined;
      });
    },

    setDirEntries: (tabId: TabId, list: DirEntry[]) => {
      // 以前のフォーカス状態をなるべく保持する
      const sel = get().getSelection(tabId);
      const prevName: string | undefined = get().findHistory(tabId, get().getCurrentTab().path);
      const newName: string | undefined = list[sel.focusIndex]?.name;
      if (!!prevName && prevName === newName) {
        // 新しいリストの同じ位置に同じ名前がある
        sel.selectionIndexes = new Set([sel.focusIndex]);
        sel.anchorIndex = sel.focusIndex;
      } else {
        const find = list.findIndex(f => f.name === prevName);
        if (0 <= find) {
          // フォーカスしていたファイルが別の位置に移動した
          sel.focusIndex = find;
          sel.selectionIndexes = new Set([sel.focusIndex]);
          sel.anchorIndex = sel.focusIndex;
        } else {
          // フォーカスしていたファイルがなくなった
          sel.focusIndex = 0;
          sel.selectionIndexes = list.length === 0 ? new Set() : new Set([sel.focusIndex]);
          sel.anchorIndex = sel.focusIndex;
        }
      }

      updateTab(tabId, tab => {
        tab.dirEntries = list;
        tab.errorMsg = undefined;
        tab.requestSort = false;
        tab.refreshCount = tab.refreshCount + 1;
      });
      get().clearFileInfoWrapper(tabId);
      get().setSelection(tabId, sel);
    },

    setErrorMsg: (tabId: TabId, msg: string) => {
      updateTab(tabId, tab => {
        tab.errorMsg = msg;
        tab.dirEntries = [];
      });
    },

    setSortCondition: (tabId: TabId, sortCondition: SortCondition) => {
      updateTab(tabId, tab => {
        tab.sortCondition = sortCondition;
        tab.requestSort = true;
        tab.dirEntries = undefined;
        tab.errorMsg = undefined;
        tab.refreshCount = tab.refreshCount + 1;
      });
    },
  }
};
