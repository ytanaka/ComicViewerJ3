import { mkDefaultSortCondition, TabId, TabInfo } from '@/store/tab/types';
import { FileSearchResult } from '../bindings';
import { VirtuosoHandle } from 'react-virtuoso';
import { checkCommandReturn } from '../bindings-helper';
import { useTabStore } from '@/store/tab/store';
import { useSearchResultStore } from '@/store/file-search-result-store';
import { ExecExclusibe } from '../utils';
import { rustcmds } from '../bindings-wrapper';

let debounceTimer: number | undefined;
let queuedInput: string | null = null; // 検索実行に入力された内容
let queuedRevese: boolean = false;

const emptyTab: Readonly<TabInfo> = {
  id: -1 as TabId,
  path: '',
  sortCondition: mkDefaultSortCondition(),
  requestSort: false,
  execExclusive: new ExecExclusibe(),
  refreshCount: -1,
} as const;

let searchTab: TabInfo = emptyTab;
let searchVirtuoso: VirtuosoHandle | null;

export const searchCommands = {
  // ファイル検索
  async searchNextFilename(
    tab: TabInfo,
    startIndex: number,
    romaji: string,
    reverse: boolean,
    virtuoso: VirtuosoHandle
  ) {
    searchTab = tab;
    searchVirtuoso = virtuoso;

    // デバウンス：0.3秒入力が止まるまで検索しない
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = window.setTimeout(() => {
      if (searchTab !== emptyTab) {
        trySearch(romaji, startIndex, reverse);
      }
    }, 100);
  },

  cancel() {
    if (searchTab !== emptyTab) {
      console.debug(`searchCommands.searchNextFilename() canceled`);
    }
    queuedInput = null;
    searchTab = emptyTab;
    searchVirtuoso = null;
    useSearchResultStore.getState().clear();
  },
};

let isSearching = false; // Rust検索実行中フラグ

async function trySearch(text: string, startIndex: number, reverse: boolean) {
  // 検索中ならキューに入れて終了
  if (isSearching) {
    queuedInput = text;
    queuedRevese = reverse;
    return;
  }

  // 検索開始
  useSearchResultStore.getState().setProgress(searchTab, true);
  let result: FileSearchResult | null;
  isSearching = true;
  try {
    result = await search(text, startIndex, reverse);
  } finally {
    isSearching = false;
  }
  if (result === null) {
    searchCommands.cancel();
    return;
  }

  // 結果格納
  useSearchResultStore.getState().setResult(searchTab, result);

  // 検索で見つからなかった
  if (result.type !== 'Success') return;

  // 検索で見つかった
  console.debug(`search success: ${text} =>`, result);
  useTabStore.getState().moveFocusNormal(searchTab.id, result.index);
  virtuoso_scrollIntoView(result.index);

  // 検索完了後に新しい入力があれば再検索
  if (queuedInput !== null && queuedInput !== text) {
    const next = queuedInput;
    queuedInput = null; // キューをクリア
    trySearch(next, result.index, queuedRevese); // 再検索
  }
}

// Rustで検索実行
// ※ Rustでエラーが起きたら null
// ※ 検索中に状況が変わっていたら null
async function search(text: string, startIndex: number, reverse: boolean): Promise<FileSearchResult | null> {
  console.debug(`searchCommands search(${text}, ${startIndex}, ${reverse}) start`);
  const ret = await rustcmds.searchNextFilename(searchTab.id, startIndex, text, reverse);
  const result = checkCommandReturn('searchNextFilename', ret);
  console.debug(`searchCommands search(${text}, ${startIndex}, ${reverse}) => `, result);
  if (!result) return null;

  // 検索中にタブの状況が変わっていたら結果を無視する
  const newTab = useTabStore.getState().findTab(searchTab.id);
  if (!newTab) return null;
  if (newTab.refreshCount != searchTab.refreshCount) return null;
  if (useTabStore.getState().getCurrentTab().id !== searchTab.id) return null;

  return result;
}

function virtuoso_scrollIntoView(fileIndex: number) {
  if (searchVirtuoso === null) return;
  searchVirtuoso.scrollIntoView({ index: fileIndex });
}
