import { create, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';

import { AllTabs, FileFocusHistory, MAX_HIST, TabId } from './types';
import { createTabInfoActions, TabInfoActions } from './tab-info-actions';
import { TabStoreActions, createAllTabsActions } from './store-actions';
import { createFileInfoWrapperActions, FileInfoWrapperActions } from './file-info-wrapper-actions';
import { createFileSelectionActions, FileSelectionActions } from './file-selection-actions';
import { createFileFocusHistoryActions, FileFocusHistoryActions } from './file-focus-history-actions';
import { ExecExclusibe } from '@/lib/utils';
import { rustcmds } from '@/lib/bindings-wrapper';

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
            id: t.id,
            path: t.path,
          })),
          focusHistories: state.focusHistories,
        };
      },
      onRehydrateStorage: () => state => {
        if (!state) return;
        try {
          // 保存しておいたタブIDは使えなくなっているので、タブIDを負数にしておいて、後で↓の関数を呼んで初期化する
          for (let i = 0; i < state.tabs.length; i++) {
            state.tabs[i].id = state.tabs[i].id * -1 as TabId;
            state.tabs[i].execExclusive = new ExecExclusibe();
            state.tabs[i].refreshCount = 0;
          }
          state.fileInfoListList = {};
          state.selections = {};

          state.focusHistories = Object.fromEntries(
            Object.entries(state.focusHistories).map(([k, v]) => {
              return [Number(k) * -1, v]; // タブIDを負数にする
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

function st() {
  return useTabStore.getState();
}

// ローカルストレージから復元した TabStore データを修正する
export async function fixTabStore_from_FromLocalStrage() {
  const tabs = st().tabs;

  for (const tabId of await rustcmds.getTabIds()) {
    console.info('fixFromLocalStrageStore() remove unused old tabId: ', tabId);
    await rustcmds.removeTab(tabId);
  }

  // タブIDは store から復元時に負数に変換してあるので、tabs[].`id` と focusHistories[`tabId`] を新しいタブIDに作り直す
  const oldHist = st().focusHistories;
  const newHist: Record<number, FileFocusHistory> = {};
  for (let i = 0; i < tabs.length; i++) {
    // 新規タブID発行
    const oldId = tabs[i].id;
    const newId = await rustcmds.createTab();
    tabs[i].id = newId;

    // focusHistories 再構築
    let hist = oldHist[oldId];
    if (hist === undefined) hist = { hist: [] };
    newHist[newId] = hist;
  }
  st().initTabs(tabs, newHist);
}
