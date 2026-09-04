import { useTabStore } from '@/store/tab/store';
import { FileId, TabId } from '@/store/tab/types';
import { DirEntry, rustcmds } from './bindings-wrapper';

function st() {
  return useTabStore.getState();
}

export function checkCommandReturn<T, E>(
  comment: string,
  result: { status: 'ok'; data: T } | { status: 'error'; error: E }
): T | null {
  if (result.status === 'error') {
    console.error(`command[${comment}] error: ${result.error}`);
    return null;
  }
  return result.data;
}

const DBGLOG = false;

export const logic = {
  async get_or_read_DirEntries(
    tabId: TabId,
    comment: string,
    fn: () => Promise<{ status: 'ok'; data: DirEntry[] } | { status: 'error'; error: string }>
  ) {
    const tab = st().getTab(tabId);

    // 同時呼び出しを防ぐ
    await tab.execExclusive.try_start(-1, async () => {
      console.debug(comment);
      const result = await fn();

      if (result.status === 'ok') {
        st().setDirEntries(tabId, result.data);
      } else {
        console.info('readDirEntries() error: ', result.error);
        st().setErrorMsg(tabId, result.error);
        st().setDirEntries(tabId, []);
      }
    });
  },

  async readDirEntries(tabId: TabId) {
    const tab = st().getTab(tabId);
    await this.get_or_read_DirEntries(tabId, `readDirEntries(): id:${tabId}, path:${tab.path}`, () =>
      rustcmds.readDirEntries(tabId, tab.path)
    );
  },

  async getDirEntries(tabId: TabId) {
    await this.get_or_read_DirEntries(tabId, `getDirEntries(): id:${tabId}`, () => rustcmds.getDirEntries(tabId));
  },

  async readFileInfos(tabId: TabId, startIndex: number, endIndex: number) {
    const dirEntries = st().getTab(tabId).dirEntries;
    if (!dirEntries) return;
    const overscan = 10;
    const s = Math.max(0, startIndex - overscan);
    const e = Math.min(dirEntries.length - 1, endIndex + overscan);

    // 取得対象のファイルIDを集める
    const fileIds: FileId[] = [];
    for (let i = s; i <= e; i++) {
      if (
        st().getFileInfo(tabId, dirEntries[i].file_id) === undefined &&
        st().getFileInfoErrorMsg(tabId, dirEntries[i].file_id) === undefined
      ) {
        fileIds.push(dirEntries[i].file_id);
      }
    }
    if (fileIds.length === 0) return;

    if (DBGLOG) console.debug('call tryReadFileInfos', fileIds.length);
    tryReadFileInfos(tabId, fileIds);
  },
};

// readFileInfos() が実行中に繰り返し呼ばれたら、最後の呼び出しの引数を覚えておく
let readFileInfos_pendigFileIds: FileId[] = [];
let readFileInfos_pendigTabId: TabId = -1 as TabId;

async function tryReadFileInfos(tabId: TabId, fileIds: FileId[]) {
  const tab = st().getTab(tabId);
  // 同時呼び出しを防ぐ
  const done = await tab.execExclusive.try_start(-1, () => tryReadFileInfos2(tabId, fileIds));
  if (!done) {
    if (DBGLOG) console.debug('push queue', fileIds.length);
    readFileInfos_pendigTabId = tabId;
    readFileInfos_pendigFileIds = fileIds;
  }
}

async function tryReadFileInfos2(tabId: TabId, fileIds: FileId[]) {
  // ファイル情報取得
  if (DBGLOG) console.debug('call rustcmds.getFileInfos', fileIds.length);
  const ret = await rustcmds.getFileInfos(tabId, fileIds);
  if (ret.status === 'error') {
    // TODO: toast
    console.error('rustcmds.getFileInfos()', ret.error);
  } else {
    for (let i = 0; i < ret.data.length; i++) {
      const f = ret.data[i];
      st().setFileInfo(tabId, fileIds[i], f);
    }
  }

  // ファイル情報取得中に繰り返し呼ばれたら、最後の呼び出しを再実行する
  setTimeout(() => {
    const fileIds2 = readFileInfos_pendigFileIds;
    const tabId2 = readFileInfos_pendigTabId;
    readFileInfos_pendigFileIds = [];
    readFileInfos_pendigTabId = -1 as TabId;
    if (fileIds2.length !== 0) {
      if (DBGLOG) console.debug('call2 tryReadFileInfos', fileIds2.length);
      tryReadFileInfos(tabId2, fileIds2);
    }
  }, 10);
}
