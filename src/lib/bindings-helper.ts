import { useTabStore } from '@/store/tab/store';
import { FileFocusHistory, TabId } from '@/store/tab/types';
import { commands } from './bindings';

function st() {
  return useTabStore.getState();
}

export function checkCommandResult<T, E>(comment: string, result: { status: "ok"; data: T } | { status: "error"; error: E }): T | null {
  if (result.status === 'error') {
    console.error(`command[${comment}] error: ${result.error}`)
    return null;
  }
  return result.data;
}

export const logic = {
  // ローカルストレージから復元した TabStore データを修正する
  async fixTabStore_from_FromLocalStrage() {
    const tabs = st().tabs;

    for (const tabId of await commands.getTabIds()) {
      console.info('fixFromLocalStrageStore() remove unused old tabId: ', tabId);
      await commands.removeTab(tabId);
    }

    // タブIDは store から復元時に負数に変換してあるので、tabs[].`id` と focusHistories[`tabId`] を新しいタブIDに作り直す
    const oldHist = st().focusHistories;
    const newHist: Record<number, FileFocusHistory> = {};
    for (let i = 0; i < tabs.length; i++) {
      // 新規タブID発行
      const oldId = tabs[i].id;
      const newId = await commands.createTab();
      tabs[i].id = newId;

      // focusHistories 再構築
      let hist = oldHist[oldId];
      if (hist === undefined) hist = { hist: [] };
      newHist[newId] = hist;
    }
    st().initTabs(tabs, newHist);
  },

  async readDirEntries(tabId: TabId) {
    const tab = st().getTab(tabId);

    // 同時呼び出しを防ぐ
    if (!tab.execExclusive.try_start(-1)) return;
    let result;
    try {
      console.debug(`readDirEntries(): id:${tabId}, path:${tab.path}`);
      result = await commands.readDirEntries(tabId, tab.path);
    } finally {
      tab.execExclusive.end(-1);
    }

    if (result.status === 'ok') {
      st().setDirEntries(tabId, result.data);
    } else {
      console.info('readDirEntries() error: ', result.error);
      st().setErrorMsg(tabId, result.error);
      st().setDirEntries(tabId, []);
    }
  },

  async readFileInfo(tabId: TabId, index: number) {
    const tab = st().getTab(tabId);

    if (!tab.dirEntries) throw Error('no dirEntries');
    if (!tab.dirEntries[index]) throw Error(`no dirEntries[${index}]`);

    // 同時呼び出しを防ぐ
    if (!tab.execExclusive.try_start(index)) return;
    let result;
    try {
      result = await commands.getFileInfo(tabId, tab.dirEntries[index].id.toString());
    } finally {
      tab.execExclusive.end(index);
    }

    if (result.status === 'ok') {
      st().setFileInfo(tabId, index, result.data);
    } else {
      console.info('readFileInfo() error: ', result.error);
      st().setFileInfoErrorMsg(tabId, index, result.error);
    }
  },
};
