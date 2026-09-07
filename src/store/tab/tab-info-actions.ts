import { _useTabStore_setExistTabFields, mkDefaultSortCondition, TabId } from './types';
import { TabStore } from './store';
import { TabInfo } from '@/lib/bindings-wrapper';
import { SortCondition } from '@/lib/bindings';
import { StateCreator } from 'zustand';

export interface UiTabActions {
  updateTab: (tabId: TabId, newTab: TabInfo) => void;
  setSortCondition: (tabId: TabId, sortCondition: SortCondition) => void;
}

export const createUiTabActions: StateCreator<TabStore, [['zustand/immer', never]], [], UiTabActions> = (set, get) => {
  return {
    updateTab: (tabId: TabId, newTab: TabInfo) => {
      // 以前のフォーカス状態をなるべく保持する
      const tab = get().getTab(tabId);
      if (!tab) return;

      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.info = newTab;
          tab.sortCondition = mkDefaultSortCondition();
        });
      });
    },

    setSortCondition: (tabId: TabId, sortCondition: SortCondition) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.sortCondition = sortCondition;
          tab.refreshCount += 1;
        });
      });
    },
  };
};
