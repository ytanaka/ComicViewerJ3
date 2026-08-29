import { useSearchTextStore } from '@/store/file-search-text-store';
import { useTabStore } from '@/store/tab/store';
import { useUiStore } from '@/store/ui-store';
import { VirtuosoHandle } from 'react-virtuoso';
import { searchCommands } from './commands/search-commands';

function st() {
  return useTabStore.getState();
}

// ファイル検索のための、ローマ字入力検知
export function fileSearchInput_handleKey(e: KeyboardEvent, virtuoso: VirtuosoHandle | null): boolean {
  if (virtuoso === null) return false;

  // console.debug(`ev: [${e.key}]`);

  if (fileSearchInput_handleKey_impl(e, virtuoso)) {
    return true;
  }

  // 有効なテキスト入力でない場合は、次の入力をリセットする
  useSearchTextStore.setState(() => ({ prevTypeTime: 0 }));
  return false;
}

function fileSearchInput_handleKey_impl(e: KeyboardEvent, virtuoso: VirtuosoHandle): boolean {
  // Shift以外のキーは無効
  if (e.ctrlKey || e.altKey) return false;
  // Shift押しただけは入力がないけどOK
  if (e.shiftKey && e.key === 'Shift') return true;
  // 文字入力は１文字になるはず
  if (e.key.length !== 1) return false;

  const delay = e.timeStamp - useSearchTextStore.getState().prevTypeTime;
  const timeout = useUiStore.getState().fileSearchInputTimeoutMs;

  // console.debug(`delay:${delay} timeout:${timeout}`, JSON.stringify(useSearchTextStore.getState()))

  if (timeout < delay) {
    // タイムアウトしたら既存入力をクリアして新しい入力を続ける
    useSearchTextStore.getState().clear();
  }

  useSearchTextStore.getState().addText(e.key);
  const romaji = useSearchTextStore.getState().text;

  console.log(`fileSearchInput_handleKey() text:[${useSearchTextStore.getState().text}]`);

  // 検索する (非同期実行で)
  const tab = st().getCurrentTab();
  const focusIndex = st().getSelection(tab.id).focusIndex;
  searchCommands.searchNextFilename(tab, focusIndex, romaji, virtuoso);

  return true;
}
