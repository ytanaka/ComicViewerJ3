import { FileId, TabId } from "@/store/tab/types";
import { commands, DirEntryUI, Either, FileInfoUI, FileMetadata, SortType } from "./bindings";

// UIの中では number でなく TabId, FileId を使うので、ラッパー関数を作る
export const rustcmds = {
  exitApp: commands.exitApp,
  init: commands.init,
  createTab: () => { return commands.createTab().then((tabId) => tabId as TabId) },
  removeTab: (tabId: TabId) => { return commands.removeTab(tabId) },
  getTabIds: () => { return commands.getTabIds().then((list) => list.map((tabId) => tabId as TabId)) },
  readDirEntries: (tabId: TabId, path: string) => {
    return commands.readDirEntries(tabId, path).then((result) => cnvOk(result, (data) => data.map(toDirEntry)));
  },
  getDirEntries: (tabId: TabId) => {
    return commands.getDirEntries(tabId).then((result) => cnvOk(result, (data) => data.map(toDirEntry)));
  },
  getFileInfo: (tabId: TabId, fileId: FileId) => {
    return commands.getFileInfo(tabId, fileId.toString()).then((result) => cnvOk(result, (data) => toFileInfo(data)))
  },
  getFileInfos: (tabId: TabId, fileIds: FileId[]) => {
    return commands.getFileInfos(tabId, fileIds.map((i) => i.toString())).then((result) => cnvOk(result, (data) => data.map(toFileInfo)))
  },
  sortFiles: (tabId: TabId, sortType: SortType) => { return commands.sortFiles(tabId, sortType) },
  searchNextFilename: (tabId: TabId, startIndex: number, romaji: string, reverse: boolean) => { return commands.searchNextFilename(tabId, startIndex, romaji, reverse) },
  loadPreferences: commands.loadPreferences,
  savePreferences: commands.savePreferences,
};

export type DirEntry = {
  file_id: FileId,
  is_dir: boolean,
  name: string,
};
function toDirEntry(from: DirEntryUI): DirEntry {
  return {
    file_id: from.file_id as FileId,
    is_dir: from.is_dir,
    name: from.name,
  }
}

export type FileInfo = {
  metadata: Either<FileMetadata, string>,
};
function toFileInfo(from: FileInfoUI): FileInfo {
  return {
    metadata: from.metadata
  }
}

function cnvOk<F, T>(from: { status: "ok"; data: F; } | { status: "error"; error: string; }, cnv: (from: F) => T): { status: "ok"; data: T; } | { status: "error"; error: string; } {
  if (from.status === 'ok') {
    return { status: 'ok', data: cnv(from.data) };
  } else {
    throw from;
  }
}
