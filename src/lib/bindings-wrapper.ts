import { FileId, TabId } from "@/store/tab/types";
import { commands, SortType } from "./bindings";

// UIの中では number でなく TabId, FileId を使うので、ラッパー関数を作る
export const rustcmd = {
  exitApp: commands.exitApp,
  init: commands.init,
  createTab: () => { return commands.createTab().then((v) => v as TabId) },
  removeTab: (tabId: TabId) => { return commands.removeTab(tabId) },
  getTabIds: () => { return commands.getTabIds().then((list) => list.map((i) => i as TabId)) },
  readDirEntries: (tabId: TabId, path: string) => { return commands.readDirEntries(tabId, path) },
  getDirEntries: (tabId: TabId) => { return commands.getDirEntries(tabId) },
  getFileInfo: (tabId: TabId, fileId: FileId) => { return commands.getFileInfo(tabId, fileId.toString()) },
  getFileInfos: (tabId: TabId, fileIds: FileId[]) => { return commands.getFileInfos(tabId, fileIds.map((i) => i.toString())) },
  sortFiles: (tabId: TabId, sortType: SortType) => { return commands.sortFiles(tabId, sortType) },
  searchNextFilename: (tabId: TabId, startIndex: number, romaji: string, reverse: boolean) => { return commands.searchNextFilename(tabId, startIndex, romaji, reverse) },
  loadPreferences: commands.loadPreferences,
  savePreferences: commands.savePreferences,
};
