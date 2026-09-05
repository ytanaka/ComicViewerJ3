import { create, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';

import { AllTabs, MAX_HIST, mkDefaultSortCondition, TabId } from './types';
import { createUiTabActions, UiTabActions } from './tab-info-actions';
import { TabStoreActions, createAllTabsActions } from './store-actions';
import { createFileSelectionActions, FileSelectionActions } from './file-selection-actions';
import { createFileFocusHistoryActions, FileFocusHistoryActions } from './file-focus-history-actions';

export type TabActions = TabStoreActions &
  UiTabActions &
  FileSelectionActions &
  FileFocusHistoryActions;

export type TabStore = AllTabs & TabActions;

export const createTabActions = (
  set: StoreApi<TabStore>['setState'],
  get: StoreApi<TabStore>['getState']
): TabActions => ({
  ...createAllTabsActions(set, get),
  ...createUiTabActions(set, get),
  ...createFileSelectionActions(set, get),
  ...createFileFocusHistoryActions(set, get),
});

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      currentTabIndex: 0,
      tabs: [],
      fileInfoListList: {},
      selections: {},
      focusHistories: {},
      focusHistoryMax: MAX_HIST,

      ...createTabActions(set, get),
    }),
    {
      name: 'tab-state',
      partialize: state => {
        return {
          currentTabIndex: state.currentTabIndex,
          tabs: state.tabs.map(t => ({
            ...t,
            errorMsg: undefined,
            sortCondition: mkDefaultSortCondition(),
            requestSort: false,
          })),
        };
      },
      onRehydrateStorage: () => state => {
        if (!state) return;
        try {
          for (let i = 0; i < state.tabs.length; i++) {
            state.tabs[i].tab.id = (state.tabs[i].tab.id * -1) as TabId;
            state.tabs[i].errorMsg = undefined;
            state.tabs[i].sortCondition = mkDefaultSortCondition();
            state.tabs[i].requestSort = false;
          }
        } catch (e) {
          console.error(e);
        }
        console.info('TabState: onRehydrateStorage !!!!!', state);
      },
    }
  )
);
