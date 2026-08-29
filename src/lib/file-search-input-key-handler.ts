import { useSearchTextStore } from "@/store/file-search-text-store";
import { useUiStore } from "@/store/ui-store";

export function fileSearchInput_handleKey(e: KeyboardEvent): boolean {
  // console.debug(`ev: [${e.key}]`);

  if (fileSearchInput_handleKey_impl(e)) {
    return true;
  }

  // 有効なテキスト入力でない場合は、次の入力をリセットする
  useSearchTextStore.setState(() => ({ prevTypeTime: 0 }));
  return false;
}

function fileSearchInput_handleKey_impl(e: KeyboardEvent): boolean {
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

  console.log(`fileSearchInput_handleKey() text:[${useSearchTextStore.getState().text}]`);

  return true;
}