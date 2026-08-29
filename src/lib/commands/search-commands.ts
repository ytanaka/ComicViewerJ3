import { TabInfo } from '@/store/tab/types';
import { commands } from '../bindings';
import { VirtuosoHandle } from 'react-virtuoso';
import { checkCommandResult } from '../bindings-helper';
import { useTabStore } from '@/store/tab/store';

let debounceTimer: number | undefined;
let isSearching = false; // 検索実行中フラグ
let queuedInput: string | null = null; // 検索実行に入力された内容

let searchTab: TabInfo | null;
let searchVirtuoso: VirtuosoHandle | null;

export const searchCommands = {
  async searchNextFilename(tab: TabInfo, startIndex: number, romaji: string, virtuoso: VirtuosoHandle) {
    searchTab = tab;
    searchVirtuoso = virtuoso;

    // デバウンス：0.3秒入力が止まるまで検索しない
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(() => {
      trySearch(romaji, startIndex);
    }, 100);
  },
};

async function trySearch(text: string, startIndex: number) {
  // 検索中ならキューに入れて終了
  if (isSearching) {
    queuedInput = text;
    return;
  }

  isSearching = true;
  let resultIndex: number | null;
  try {
    resultIndex = await search(text, startIndex);
  } finally {
    isSearching = false;
  }
  if (resultIndex === null) return;

  // 検索完了後に新しい入力があれば再検索
  if (queuedInput !== null && queuedInput !== text) {
    const next = queuedInput;
    queuedInput = null; // キューをクリア
    trySearch(next, resultIndex); // 再検索
  }
}

async function search(text: string, startIndex: number): Promise<number | null> {
  if (searchTab === null) return null;
  if (!searchVirtuoso) return null;

  const result = await commands.searchNextFilename(searchTab.id, startIndex, text);
  const ret = checkCommandResult('searchNextFilename', result);
  if (!ret) return null;

  // 検索中にタブの状況が変わっていたら結果を破棄する
  if (!useTabStore.getState().existsTabId(searchTab.id)) return null;
  if (useTabStore.getState().getCurrentTab().id !== searchTab.id) return null;
  const newTab = useTabStore.getState().getTab(searchTab.id);
  if (newTab.refreshCount != searchTab.refreshCount) return null;

  // 形態素解析途中
  if (ret.type === 'FailNoCache') {
    console.debug(`FailNoCache`);
    return null;
  }

  // 一致しない
  if (ret.type === 'FailNoMatch') {
    console.debug(`FailNoMatch`);
    return null;
  }

  // 検索成功
  console.debug(`search success: ${text} =>`, ret);
  useTabStore.getState().moveFocusNormal(searchTab.id, ret.index);
  searchVirtuoso.scrollIntoView({ index: ret.index + 1 });
  return ret.index;
}
