import { create, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';

import { AllTabs, MAX_HIST } from './types';
import { createTabInfoActions, TabInfoActions } from './tab-info-actions';
import { TabStoreActions, createAllTabsActions } from './store-actions';
import { createFileInfoWrapperActions, FileInfoWrapperActions } from './file-info-wrapper-actions';
import { createFileSelectionActions, FileSelectionActions } from './file-selection-actions';
import { createFileFocusHistoryActions, FileFocusHistoryActions } from './file-focus-history-actions';
import { ExecExclusibe } from '@/lib/utils';

export type TabActions = TabStoreActions &
  TabInfoActions &
  FileInfoWrapperActions &
  FileSelectionActions &
  FileFocusHistoryActions;

export type TabStore = AllTabs & TabActions;

export const createTabActions = (
  set: StoreApi<TabStore>['setState'],
  get: StoreApi<TabStore>['getState']
): TabActions => ({
  ...createAllTabsActions(set, get),
  ...createTabInfoActions(set, get),
  ...createFileInfoWrapperActions(set, get),
  ...createFileSelectionActions(set, get),
  ...createFileFocusHistoryActions(set, get),
});

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      currentTabIndex: 0,
      tabs: [],
      fileInfos: {},
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
            id: t.id,
            path: t.path
          })),
          focusHistories: state.focusHistories,
        };
      },
      onRehydrateStorage: () => state => {
        if (!state) return;
        try {
          // 保存しておいたタブIDは使えなくなっているので、タブIDを負数にしておいてTabStateInitializer で初期化する
          for (let i = 0; i < state.tabs.length; i++) {
            state.tabs[i].id = state.tabs[i].id * -1;
            state.tabs[i].execExclusive = new ExecExclusibe();
            state.tabs[i].refreshCount = 0;
          }
          state.fileInfos = {};
          state.selections = {};
          state.focusHistories = Object.fromEntries(
            Object.entries(state.focusHistories).map(([k, v]) => {
              return [Number(k) * -1, v];
            })
          );
        } catch (e) {
          console.error(e);
        }
        console.info('TabState: onRehydrateStorage !!!!!', state);
      },
    }
  )
);
