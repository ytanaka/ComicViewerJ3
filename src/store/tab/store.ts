import { create, StoreApi } from "zustand";
import { persist } from "zustand/middleware";

import { AllTabs } from "./types";
import { createTabInfoActions, TabInfoActions } from "./tab-info-actions";
import { AllTabsActions, createAllTabsActions } from "./all-tabs-actions";
import { createFileInfoWrapperActions, FileInfoWrapperActions } from "./file-info-wrapper-actions";
import { createFileSelectionActions, FileSelectionActions } from "./file-selection-actions";
import { createFileFocusHistoryActions, FileFocusHistoryActions } from "./file-focus-history-actions";
import { ExecExclusibe } from "@/lib/utils";

export type TabActions =
  & AllTabsActions
  & TabInfoActions
  & FileInfoWrapperActions
  & FileSelectionActions
  & FileFocusHistoryActions;

export type TabStore = AllTabs & TabActions;

export const createTabActions = (
  set: StoreApi<TabStore>["setState"],
  get: StoreApi<TabStore>["getState"],
): TabActions => ({
  ...createAllTabsActions(set, get),
  ...createTabInfoActions(set, get),
  ...createFileInfoWrapperActions(set, get),
  ...createFileSelectionActions(set, get),
  ...createFileFocusHistoryActions(set, get),
});

export const useTabStore = create<TabStore>()(persist((set, get) => ({
  currentTabIndex: 0,
  tabs: [],
  fileInfos: {},
  selections: {},
  focusHistories: {},

  ...createTabActions(set, get),
}), {
  name: 'tab-state',
  partialize: state => {
    return {
      currentTabIndex: state.currentTabIndex,
      tabs: state.tabs.map((t) => ({ id: t.id, path: t.path })),
      focusHistories: state.focusHistories,
    };
  },
  onRehydrateStorage: () => state => {
    if (!state) return;
    try {
      for (let i = 0; i < state.tabs.length; i++) {
        // とりあえず -1 にしておいてTabStateInitializer で初期化する
        state.tabs[i].id = -1;
        state.tabs[i].execExclusive = new ExecExclusibe();
      }
      state.fileInfos = {};
      state.selections = {};
    } catch (e) {
      console.error(e);
    }
    console.info('TabState: onRehydrateStorage !!!!!', state);
  },
}));
