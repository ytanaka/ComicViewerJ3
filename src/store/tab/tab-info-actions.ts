import {
  _useTabStore_setExistTabFields,
  FileViewMode,
  getNextDummyTabId,
  mkDefaultSortCondition,
  TabId,
} from './types';
import { TabStore } from './store';
import { TabInfo } from '@/lib/bindings-wrapper';
import { SortCondition } from '@/lib/bindings';
import { StateCreator } from 'zustand';
import { removeQueries_getDirEntries } from '@/services/tab-files';

export interface UiTabActions {
  updateTab: (tabId: TabId, newTab: TabInfo) => void;
  setSortCondition: (tabId: TabId, sortCondition: SortCondition) => void;
  incRefreshCount: (tabId: TabId) => void;
  invalidateTabForRefresh: (tabId: TabId) => void;
  setViewMode: (tabId: TabId, mode: FileViewMode) => void;
}

export const createUiTabActions: StateCreator<TabStore, [['zustand/immer', never]], [], UiTabActions> = (set, get) => {
  return {
    updateTab: (tabId: TabId, newTab: TabInfo) => {
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
      removeQueries_getDirEntries(tabId);
    },

    incRefreshCount: (tabId: TabId) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.refreshCount += 1;
        });
      });
      removeQueries_getDirEntries(tabId);
    },

    // 同じパスで再読み込みさせる
    // ※ これを呼ぶ前に rustcmds.removeTab() しておくこと
    invalidateTabForRefresh: (tabId: TabId) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          if (0 < tab.info.id) tab.info.id = getNextDummyTabId();
        });
      });
    },

    setViewMode: (tabId: TabId, mode: FileViewMode) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.fileViewMode = mode;
        });
      });
    },
  };
};
