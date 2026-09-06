import { SortCondition } from '@/lib/bindings';
import { TabInfo } from '@/lib/bindings-wrapper';
import { TabStore } from './store';
import type { Draft } from "immer";

export type TabId = number & { readonly __brand: unique symbol };
export type FileId = number & { readonly __brand: unique symbol };

export const MAX_HIST = 10;

export interface AllTabs {
  currentTabIndex: number; // tabs = [] の場合は 0
  tabs: UiTab[];
}
export interface UiTab {
  info: TabInfo;
  sortCondition: SortCondition;
  selection: FileSelection;
  focusHistories: FileFocus[]; // 先頭が古いデータ
  refreshCount: number; // ソートされると + 1 // TODO
}
export interface FileSelection {
  focusIndex: number;
  anchorIndex: number;
  selectionIndexes: Set<number>;
}
export interface FileFocus {
  path: string;
  filename: string;
}

// =====================================================================================================================

let nextDummyTabId = -1;

export function mkDummyTab(path: string): TabInfo {
  const tabId = nextDummyTabId;
  nextDummyTabId += 1;
  return { id: tabId as TabId, path }
}
export function mkUiTab(tab: TabInfo): UiTab {
  return {
    info: tab,
    sortCondition: mkDefaultSortCondition(),
    selection: mkFileSelection(),
    focusHistories: [],
    refreshCount: 0,
  };
}

export function mkDefaultSortCondition(): SortCondition {
  return { sort_type: { type: 'Name' }, asc: true };
}

export function mkFileSelection(): FileSelection {
  return {
    focusIndex: 0,
    anchorIndex: 0,
    selectionIndexes: new Set<number>(),
  };
}

// =====================================================================================================================

export function _useTabStore_getImmerTab(state: Draft<TabStore>, tabId: TabId): UiTab | undefined {
  return state.tabs.find(t => t.info.id === tabId);
}

export function _useTabStore_setExistTabFields(state: Draft<TabStore>, tabId: TabId, fn: (tab: UiTab) => void): boolean {
  const tab = _useTabStore_getImmerTab(state, tabId);
  if (!tab) return false;
  fn(tab);
  return true;
}
