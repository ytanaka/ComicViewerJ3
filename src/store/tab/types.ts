import { DirEntry, FileInfo } from '@/lib/bindings';
import { ExecExclusibe } from '@/lib/utils';

export type TabId = number;
export type FileId = number;

export const MAX_HIST = 10;

export interface AllTabs {
  currentTabIndex: number;
  tabs: TabInfo[];

  fileInfoListList: Record<TabId, Record<FileId, FileInfoWrapper>>;
  selections: Record<TabId, FileSelection>;
  focusHistories: Record<TabId, FileFocusHistory>;
  focusHistoryMax: number;
}
export interface TabInfo {
  id: TabId;
  path: string;
  dirEntries?: DirEntry[];
  errorMsg?: string;
  execExclusive: ExecExclusibe;
  refreshCount: number;
}
export interface FileInfoWrapper {
  fileInfo?: FileInfo;
  errorMsg?: string;
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

export function mkTabInfo(id: TabId, path: string): TabInfo {
  return {
    id,
    path,
    execExclusive: new ExecExclusibe(),
    refreshCount: 0,
  };
}

export function mkFileSelection(): FileSelection {
  return {
    focusIndex: 0,
    anchorIndex: 0,
    selectionIndexes: new Set<number>(),
  };
}
