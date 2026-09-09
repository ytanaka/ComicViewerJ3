import { SortCondition } from '@/lib/bindings';
import { TabInfo } from '@/lib/bindings-wrapper';
import { TabStore } from './store';
import type { Draft } from 'immer';

export type TabId = number & { readonly __brand: unique symbol };
export type FileId = number & { readonly __brand: unique symbol };

export const MAX_HIST = 10;

export interface AllTabs {
  currentTabIndex: number; // tabs = [] の場合は 0
  tabs: UiTab[];
}
export interface UiTab {
  // TabInfo.path: 必ず設定されている
  // TabInfo.id: 負数の場合は TabInfo.path で新しいRustタブを作成する必要がある
  //     負数になるのは、zustand がLocalStrageから復元したときと、Rustからファイル一覧更新イベントが届いたとき
  info: TabInfo;

  sortCondition: SortCondition;
  selection: FileSelection;
  focusHistories: FileFocus[]; // 先頭が古いデータ
  refreshCount: number; // ソートされると + 1
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

export function getNextDummyTabId(): TabId {
  const tabId = nextDummyTabId;
  nextDummyTabId -= 1;
  return tabId as TabId;
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
    selectionIndexes: new Set(),
  };
}

// =====================================================================================================================

export function _useTabStore_getImmerTab(state: Draft<TabStore>, tabId: TabId): UiTab | undefined {
  return state.tabs.find(t => t.info.id === tabId);
}

export function _useTabStore_setExistTabFields(
  state: Draft<TabStore>,
  tabId: TabId,
  fn: (tab: UiTab) => void
): boolean {
  const tab = _useTabStore_getImmerTab(state, tabId);
  if (!tab) return false;
  fn(tab);
  return true;
}
