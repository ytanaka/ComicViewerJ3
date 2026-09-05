import { FileId, TabId } from '@/store/tab/types';
import { commands, DirEntryUI, Either, FileInfoUI, FileMetadata, SortCondition, SortType, TabInfoUI } from './bindings';

// UIの中では number でなく TabId, FileId を使うので、ラッパー関数を作る
export const rustcmds = {
  exitApp: commands.exitApp,
  init: commands.init,
  createTab: (path: string) => {
    return commands.createTab(path).then(result => cnvOk(result, toTabInfo));
  },
  cloneTab: (tabId: TabId) => {
    return commands.cloneTab(tabId).then(result => cnvOk(result, toTabInfo));
  },
  cloneTabChildDir: (tabId: TabId, fileId: FileId) => {
    return commands.cloneTabChildDir(tabId, fileId.toString()).then(result => cnvOk(result, toTabInfo));
  },
  cloneTabParentDir: (tabId: TabId) => {
    return commands.cloneTabParentDir(tabId).then(result => cnvOk(result, toTabInfo));
  },
  removeTab: (tabId: TabId) => {
    return commands.removeTab(tabId);
  },
  getTabs: () => {
    return commands.getTabs().then(list => list.map(toTabInfo));
  },
  getDirEntries: (tabId: TabId) => {
    return commands.getDirEntries(tabId).then(result => cnvOk(result, data => data.map(toDirEntry)));
  },
  getFileInfos: (tabId: TabId, fileIds: FileId[]) => {
    return commands
      .getFileInfos(
        tabId,
        fileIds.map(i => i.toString())
      )
      .then(result => cnvOk(result, data => data.map(toFileInfo)));
  },
  sortFiles: (tabId: TabId, sortCondition: SortCondition) => {
    return commands.sortFiles(tabId, sortCondition);
  },
  searchNextFilename: (tabId: TabId, startIndex: number, romaji: string, reverse: boolean) => {
    return commands.searchNextFilename(tabId, startIndex, romaji, reverse);
  },
  loadPreferences: commands.loadPreferences,
  savePreferences: commands.savePreferences,
};

export type TabInfo2 = {
  id: TabId,
  path: string,
};
function toTabInfo(from: TabInfoUI): TabInfo2 {
  return {
    id: from.id as TabId,
    path: from.path,
  };
}

export type DirEntry = {
  file_id: FileId;
  is_dir: boolean;
  name: string;
};
function toDirEntry(from: DirEntryUI): DirEntry {
  return {
    file_id: from.file_id as FileId,
    is_dir: from.is_dir,
    name: from.name,
  };
}

export type FileInfo = {
  metadata: Either<string, FileMetadata>;
};
function toFileInfo(from: FileInfoUI): FileInfo {
  return {
    metadata: from.metadata,
  };
}


function cnvOk<F, T>(
  from: { status: 'ok'; data: F } | { status: 'error'; error: string },
  cnv: (from: F) => T
): { status: 'ok'; data: T } | { status: 'error'; error: string } {
  if (from.status === 'ok') {
    return { status: 'ok', data: cnv(from.data) };
  } else {
    throw from;
  }
}

export type SortType_type = SortType['type'];
