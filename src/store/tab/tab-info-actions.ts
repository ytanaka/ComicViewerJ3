import { _useTabStore_setExistTabFields, mkDefaultSortCondition, TabId } from './types';
import { TabStore } from './store';
import { TabInfo } from '@/lib/bindings-wrapper';
import { SortCondition } from '@/lib/bindings';
import { StateCreator } from 'zustand';
import { getQueryData_getDirEntries } from '@/services/files';

export interface UiTabActions {
  updateTab: (tabId: TabId, newTab: TabInfo) => void;
  setSortCondition: (tabId: TabId, sortCondition: SortCondition) => void;
}

export const createUiTabActions: StateCreator<
  TabStore,
  [["zustand/immer", never]],
  [],
  UiTabActions
> = (set, get) => {
  return {
    updateTab: (tabId: TabId, newTab: TabInfo) => {
      // 以前のフォーカス状態をなるべく保持する
      const tab = get().getTab(tabId);
      if (!tab) return;
      const fileList = getQueryData_getDirEntries(tabId);
      const sel = { ...tab.selection };
      if (fileList) {
        const prevName: string | undefined = get().findHistory(tabId, tab.info.path);
        const newName: string | undefined = fileList[sel.focusIndex]?.name;
        if (!!prevName && prevName === newName) {
          // 新しいリストの同じ位置に同じ名前がある
          sel.selectionIndexes = new Set([sel.focusIndex]);
          sel.anchorIndex = sel.focusIndex;
        } else {
          const find = fileList.findIndex(f => f.name === prevName);
          if (0 <= find) {
            // フォーカスしていたファイルが別の位置に移動した
            sel.focusIndex = find;
            sel.selectionIndexes = new Set([sel.focusIndex]);
            sel.anchorIndex = sel.focusIndex;
          } else {
            // フォーカスしていたファイルがなくなった
            sel.focusIndex = 0;
            sel.selectionIndexes = fileList.length === 0 ? new Set() : new Set([sel.focusIndex]);
            sel.anchorIndex = sel.focusIndex;
          }
        }
      }

      set((state) => {
        _useTabStore_setExistTabFields(state, tabId, (tab) => {
          tab.info = newTab;
          tab.sortCondition = mkDefaultSortCondition();
          tab.selection = sel;
        });
      });
    },

    setSortCondition: (tabId: TabId, sortCondition: SortCondition) => {
      set((state) => {
        _useTabStore_setExistTabFields(state, tabId, (tab) => {
          tab.sortCondition = sortCondition;
          tab.refreshCount += 1;
        })
      });
    },
  };
};
