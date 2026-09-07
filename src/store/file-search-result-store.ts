import { create } from 'zustand';
import { UiTab } from './tab/types';
import { FileSearchResult } from '@/lib/bindings';
import { useUiStore } from './ui-store';

// ファイル一覧画面でローマ字入力をしてRustに問い合わせた結果
export interface FileSearchResultStore {
  tab: UiTab | null;
  progress: boolean;
  result: FileSearchResult | null;
  updateTime: number;

  setResult: (tab: UiTab, result: FileSearchResult) => void;
  setProgress: (tab: UiTab, progress: boolean) => void;
  clear: () => void;

  // 検索結果を取得 (タブ状態が変わっていたり、結果が返ってから時間が経過したら null を返す)
  getResult: (tab: UiTab) => FileSearchResult | null;
  // 検索途中かどうか
  isProgress: (tab: UiTab) => boolean;
}

export const useSearchResultStore = create<FileSearchResultStore>()((set, get) => ({
  tab: null,
  result: null,
  progress: false,
  updateTime: 0,

  setResult: (tab: UiTab, result: FileSearchResult) => {
    set(() => ({
      tab,
      progress: false,
      result,
      updateTime: Date.now(),
    }));
  },

  setProgress: (tab: UiTab, progress: boolean) => {
    set(() => ({
      tab,
      progress,
      result: null,
      updateTime: Date.now(),
    }));
  },

  clear: () => {
    set(() => ({
      tab: null,
      progress: false,
      result: null,
      updateTime: 0,
    }));
  },

  getResult: (tab: UiTab) => {
    const ret = get();
    if (!checkSameTab(tab, ret)) return null;

    const timeout = useUiStore.getState().fileSearchResultDisplayTimeoutMs;
    const delay = Date.now() - ret.updateTime;
    if (timeout < delay) return null;

    return ret.result;
  },

  isProgress: (tab: UiTab) => {
    const ret = get();
    if (!checkSameTab(tab, ret)) return false;
    return ret.progress;
  },
}));

function checkSameTab(currentTab: UiTab, ret: FileSearchResultStore): boolean {
  if (currentTab.info.id !== ret.tab?.info.id) return false;
  if (currentTab.refreshCount !== ret.tab?.refreshCount) return false;
  return true;
}
