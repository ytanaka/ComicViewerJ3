import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { AllTabs, getNextDummyTabId, mkDefaultSortCondition } from './types';
import { createUiTabActions, UiTabActions } from './tab-info-actions';
import { TabStoreActions, createAllTabsActions } from './store-actions';
import { createFileSelectionActions, FileSelectionActions } from './file-selection-actions';
import { createFileFocusHistoryActions, FileFocusHistoryActions } from './file-focus-history-actions';

export type TabActions = TabStoreActions & UiTabActions & FileSelectionActions & FileFocusHistoryActions;

export type TabStore = AllTabs & TabActions;

export const useTabStore = create<TabStore>()(
  persist(
    immer((set, get, store) => ({
      currentTabIndex: 0,
      tabs: [],

      ...createAllTabsActions(set, get, store),
      ...createUiTabActions(set, get, store),
      ...createFileSelectionActions(set, get, store),
      ...createFileFocusHistoryActions(set, get, store),
    })),
    {
      name: 'tab-state',
      partialize: state => {
        return {
          currentTabIndex: state.currentTabIndex,
          tabs: state.tabs.map(t => ({
            ...t,
            sortCondition: mkDefaultSortCondition(),
            refreshCount: 0,
          })),
        };
      },
      onRehydrateStorage: () => state => {
        if (!state) return;
        try {
          for (let i = 0; i < state.tabs.length; i++) {
            state.tabs[i].info.id = getNextDummyTabId();
            state.tabs[i].sortCondition = mkDefaultSortCondition();
            state.tabs[i].selection.selectionIndexes = new Set();
          }
        } catch (e) {
          console.error(e);
        }
        console.info('TabState: onRehydrateStorage !!!!!', state);
      },
    }
  )
);
