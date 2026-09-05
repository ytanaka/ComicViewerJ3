import { mkDefaultSortCondition, mkFileSelection, TabId, UiTab } from './types';
import { TabStore } from './store';
import { DirEntry, TabInfo } from '@/lib/bindings-wrapper';
import { SortCondition } from '@/lib/bindings';

export interface UiTabActions {
  updateTab: (tabId: TabId, newTab: TabInfo) => void;

  setDirEntries: (tabId: TabId, list: DirEntry[]) => void;
  setErrorMsg: (tabId: TabId, msg: string) => void;

  setSortCondition: (tabId: TabId, sortCondition: SortCondition) => void;
}

export const createUiTabActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore
): UiTabActions => {
  function _updateTab(tabId: TabId, fn: (tab: UiTab) => void) {
    set(state => {
      const tab = state.getTab(tabId);
      if (!tab) {
        console.error(`no tab(${tabId})`);
        return state;
      } else {
        fn(tab);
        const newTabs = state.tabs.map(t => (t.tab.id !== tab.tab.id ? t : { ...tab }));
        return { tabs: newTabs };
      }
    });
    return true;
  }

  return {
    updateTab: (tabId: TabId, newTab: TabInfo) => {
      _updateTab(tabId, tab => {
        tab.tab = newTab;
        tab.selection = mkFileSelection();
        tab.sortCondition = mkDefaultSortCondition();
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

      _updateTab(tabId, tab => {
        tab.dirEntries = list;
        tab.errorMsg = undefined;
        tab.requestSort = false;
        tab.refreshCount = tab.refreshCount + 1;
      });
      get().clearFileInfoWrapper(tabId);
      get().setSelection(tabId, sel);
    },

    setErrorMsg: (tabId: TabId, msg: string) => {
      _updateTab(tabId, tab => {
        tab.errorMsg = msg;
        tab.dirEntries = [];
      });
    },

    setSortCondition: (tabId: TabId, sortCondition: SortCondition) => {
      _updateTab(tabId, tab => {
        tab.sortCondition = sortCondition;
        tab.requestSort = true;
        tab.dirEntries = undefined;
        tab.errorMsg = undefined;
        tab.refreshCount = tab.refreshCount + 1;
      });
    },
  };
};
