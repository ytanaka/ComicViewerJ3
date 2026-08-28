import { DirEntry, FileInfo } from "@/lib/bindings";

export type TabId = number;
export type FileId = number;

export const MAX_HIST = 10;

export interface AllTabs {
  currentTabIndex: number
  tabs: TabInfo[]

  fileInfos: Record<TabId, Record<FileId, FileInfoWrapper>>
  selections: Record<TabId, FileSelection>
  focusHistories: Record<TabId, FileFocusHistory>
}
export interface TabInfo {
  id: number;
  path: string;
  dirEntries?: DirEntry[];
  errorMsg?: string;
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
