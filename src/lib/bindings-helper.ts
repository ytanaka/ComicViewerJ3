import { useTabStore } from '@/store/tab/store';
import { TabId } from '@/store/tab/types';
import { rustcmds } from './bindings-wrapper';

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

export const logic = {
  async readDirEntries(tabId: TabId) {
    const tab = st().getTab(tabId);

    // 同時呼び出しを防ぐ
    await tab.execExclusive.try_start(-1, async () => {
      console.debug(`readDirEntries(): id:${tabId}, path:${tab.path}`);
      const result = await rustcmds.readDirEntries(tabId, tab.path);

      if (result.status === 'ok') {
        st().setDirEntries(tabId, result.data);
      } else {
        console.info('readDirEntries() error: ', result.error);
        st().setErrorMsg(tabId, result.error);
        st().setDirEntries(tabId, []);
      }
    });
  },

  async readFileInfo(tabId: TabId, index: number) {
    const tab = st().getTab(tabId);

    // 同一IDの同時呼び出しを防ぐ
    await tab.execExclusive.try_start(index, async () => {
      const tab = st().getTab(tabId);
      if (!tab.dirEntries) throw Error('no dirEntries');
      const dirEnt = tab.dirEntries[index];
      if (!dirEnt) throw Error(`no dirEntries[${index}]`);

      const result = await rustcmds.getFileInfo(tabId, dirEnt.file_id);

      if (result.status === 'ok') {
        st().setFileInfo(tabId, dirEnt.file_id, result.data);
      } else {
        console.info('readFileInfo() error: ', result.error);
        st().setFileInfoErrorMsg(tabId, dirEnt.file_id, result.error);
      }
    });
  },
};
