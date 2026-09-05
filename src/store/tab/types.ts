import { SortCondition } from '@/lib/bindings';
import { TabInfo } from '@/lib/bindings-wrapper';

export type TabId = number & { readonly __brand: unique symbol };
export type FileId = number & { readonly __brand: unique symbol };

export const MAX_HIST = 10;

export interface AllTabs {
  currentTabIndex: number;
  tabs: UiTab[];
}
export interface UiTab {
  tab: TabInfo;
  errorMsg?: string; // dirEntries を更新しようとしたときのエラー
  sortCondition: SortCondition;
  requestSort: boolean;

  selection: FileSelection;
  focusHistories: FileFocusHistory;
}
export interface FileSelection {
  focusIndex: number;
  anchorIndex: number;
  selectionIndexes: Set<number>;
}
export interface FileFocusHistory {
  // 先頭が古いデータ
  hist: HistElm[];
}
export interface HistElm {
  path: string;
  filename: string;
}

// =====================================================================================================================

export function mkUiTab(tab: TabInfo): UiTab {
  return {
    tab,
    sortCondition: mkDefaultSortCondition(),
    requestSort: false,
    selection: mkFileSelection(),
    focusHistories: { hist: [] },
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
