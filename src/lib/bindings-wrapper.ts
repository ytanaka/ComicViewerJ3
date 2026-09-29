import { toast } from 'sonner';

import {
  AppPreferences,
  commands,
  CreateTabError,
  DirEntryUI,
  Either,
  FileInfoUI,
  FileMetadata,
  FilenameCmpType,
  Dimension,
  SortCondition,
  SortType,
  TabInfoUI,
  FileOpResult,
  CutOrCopy,
} from './bindings';
import { logErr } from './tools/log';
import { dialogCommands } from './commands/dialog-commands';

export type TabId = number & { readonly __brand: unique symbol };
export type FileId = number & { readonly __brand: unique symbol };
export type TaskId = number & { readonly __brand: unique symbol };

// UIの中では number でなく TabId, FileId を使うので、ラッパー関数を作る
export const rustcmds = {
  init: commands.init,
  exitApp: commands.exitApp,
  setFullscreen: commands.setFullscreen,
  invokeProgram: commands.invokeProgram,

  cancelTask: (taskId: TaskId) => {
    return commands.cancelTask(taskId);
  },

  createTab: (path: string) => {
    return commands.createTab(path).then(result => cnvOk(result, toCreateTabResult));
  },
  cloneTab: (tabId: TabId) => {
    return commands.cloneTab(tabId).then(result => cnvOk(result, toCreateTabResult));
  },
  cloneTabChildDir: (tabId: TabId, fileId: FileId) => {
    return commands.cloneTabChildDir(tabId, fileId.toString()).then(result => cnvOk(result, toCreateTabResult));
  },
  cloneTabParentDir: (tabId: TabId) => {
    return commands.cloneTabParentDir(tabId).then(result => cnvOk(result, toCreateTabResult));
  },
  cloneTabSiblingDir: (tabId: TabId, moveNext: boolean) => {
    return commands.cloneTabSiblingDir(tabId, moveNext).then(result => cnvOk(result, toCreateTabResult));
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

  createFile: (tabId: TabId, name: string) => {
    return commands.createFile(tabId, name);
  },
  createDirectory: (tabId: TabId, name: string) => {
    return commands.createDirectory(tabId, name);
  },
  renameFile: (tabId: TabId, fileId: FileId, name: string) => {
    return commands.renameFile(tabId, fileId.toString(), name);
  },
  removeFiles: (tabId: TabId, fileIds: FileId[], taskId: TaskId) => {
    return commands.removeFiles(
      tabId,
      fileIds.map(id => id.toString()),
      taskId
    );
  },
  getFilesProperty: (tabId: TabId, fileIds: FileId[], taskId: TaskId) => {
    return commands.getFilesProperty(
      tabId,
      fileIds.map(id => id.toString()),
      taskId
    );
  },

  fileCutOrCopyToClipboard: (mode: CutOrCopy, tabId: TabId, fileIds: FileId[]) => {
    return commands.fileCutOrCopyToClipboard(mode, tabId, fileIds.map(id => id.toString()));
  },
  filePasteFromClipboard: (tabId: TabId) => {
    return commands.filePasteFromClipboard(tabId);
  },

  searchNextFilename: (tabId: TabId, startIndex: number, romaji: string, reverse: boolean) => {
    return commands.searchNextFilename(tabId, startIndex, romaji, reverse);
  },
  getImageSize: (tabId: TabId, fileId: FileId) => {
    return commands.getImageSize(tabId, fileId.toString());
  },
  getThumbnail: (tabId: TabId, fileId: FileId, size: number) => {
    return commands.getThumbnail(tabId, fileId.toString(), size);
  },
  getResizedImg: (tabId: TabId, fileId: FileId, size: Dimension) => {
    return commands.getResizedImg(tabId, fileId.toString(), size);
  },
  loadPreferences: commands.loadPreferences,
  savePreferences: commands.savePreferences,
};

export type TabInfo = {
  id: TabId;
  path: string;
};
function toCreateTabResult(from: Either<CreateTabError, TabInfoUI>): Either<CreateTabError, TabInfo> {
  if (from.Left) {
    return { Left: from.Left };
  } else {
    return {
      Right: toTabInfo(from.Right),
    };
  }
}
function toTabInfo(from: TabInfoUI): TabInfo {
  return {
    id: from.id as TabId,
    path: from.path,
  };
}

export type DirEntry = {
  file_id: FileId;
  is_dir: boolean;
  is_symlink: boolean;
  name: string;
};
function toDirEntry(from: DirEntryUI): DirEntry {
  return {
    file_id: from.file_id as FileId,
    is_dir: from.is_dir,
    is_symlink: from.is_symlink,
    name: from.name,
  };
}

export type FileInfo = {
  file_id: FileId;
  metadata: Either<string, FileMetadata>;
};
function toFileInfo(from: FileInfoUI): FileInfo {
  return {
    file_id: from.file_id as FileId,
    metadata: from.metadata,
  };
}

export function mkAppPreferencesDefault(): AppPreferences {
  // この関数が呼ばれるのは rustcmds.loadPreferences() がエラーを返した時なので、実際には呼ばれないはず
  return {
    debug_filename_search_sleep_ms: 0,
    debug_remove_files_sleep_ms: 0,
    filename_sort_strength: 'Identical',
    filename_cmp: { type: 'Icu' },
    filename_cmp_by_digit: false,
    thumbnail_expiration_days: 0,
    thumbnail_command_limit: 5,
    resize_image_command_limit: 5,
    resize_image_config: { unsharp_sigma: 0.5, unsharp_threshold: 30 },
    resized_image_expiration_minutes: 3,
    default: null,
  };
}

export type RustCmdResult<T> = { status: 'ok'; data: T } | { status: 'error'; error: string };

function cnvOk<F, T>(
  from: { status: 'ok'; data: F } | { status: 'error'; error: string },
  cnv: (from: F) => T
): { status: 'ok'; data: T } | { status: 'error'; error: string } {
  if (from.status === 'ok') {
    return { status: 'ok', data: cnv(from.data) };
  } else {
    return from;
  }
}

export type SortType_type = SortType['type'];
export type FilenameCmpType_type = FilenameCmpType['type'];

let nextTaskId = 101;
export function getNextTaskId(): TaskId {
  return nextTaskId++ as TaskId;
}

export function handleRustCmdResult<T>(
  result: RustCmdResult<T>,
  logComment: string,
  userMsg: string,
  okFn?: (data: T) => void
): boolean {
  if (result.status === 'error') {
    console.warn(`${logComment} => {error:${result.error}}`);
    logErr(`システムエラー(${userMsg})`, result);
    return false;
  } else {
    console.debug(`${logComment} => {ok: ...}`);
    if (okFn) okFn(result.data);
    return true;
  }
}

export function handleRustCmdCreateTabResult(
  result: RustCmdResult<Either<CreateTabError, TabInfo>>,
  logComment: string,
  userMsg: string,
  okFn?: (data: TabInfo) => void
): boolean {
  return handleRustCmdResult(result, logComment, userMsg, either => {
    if (either.Left) {
      // ディレクトリ移動ができないのはシステムエラー出ないので、Toastを出すだけ
      toast.info(either.Left.msg, {
        id: 'handleRustCmdCreateTabResult',
        duration: 3000,
      });
      return false;
    } else {
      if (okFn) okFn(either.Right);
      return true;
    }
  });
}

export function handleRustCmdFileOpResult(
  result: RustCmdResult<FileOpResult>,
  logComment: string,
  userMsg: string,
  okFn?: () => void
): boolean {
  return handleRustCmdResult(result, logComment, userMsg, opResult => {
    let errMsg = null;
    switch (opResult.type) {
      case 'AlreadyExists':
        errMsg = 'すでに存在します';
        break;
      case 'InvalidFilename':
        errMsg = 'その名前は使用できません';
        break;
      case 'Fail':
        errMsg = opResult.error_msg;
        break;
      case 'Success':
        break;
    }
    if (errMsg) {
      dialogCommands.showMsgDialog('エラー', errMsg);
      return false;
    } else {
      if (okFn) okFn();
      return true;
    }
  });
}
