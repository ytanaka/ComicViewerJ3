import { create } from 'zustand';
import { TabInfo } from './tab/types';
import { FileSearchResult } from '@/lib/bindings';
import { useUiStore } from './ui-store';

export interface FileSearchResultStore {
  tab: TabInfo | null;
  progress: boolean;
  result: FileSearchResult | null;
  updateTime: number;

  setResult: (tab: TabInfo, result: FileSearchResult) => void;
  setProgress: (tab: TabInfo, progress: boolean) => void;
  clear: () => void;

  // 検索結果を取得 (タブ状態が変わっていたり、結果が返ってから時間が経過したら null を返す)
  getResult: (tab: TabInfo) => FileSearchResult | null;
  // 検索途中かどうか
  isProgress: (tab: TabInfo) => boolean;
}

export const useSearchResultStore = create<FileSearchResultStore>()((set, get) => ({
  tab: null,
  result: null,
  progress: false,
  updateTime: 0,

  setResult: (tab: TabInfo, result: FileSearchResult) => {
    set(() => ({
      tab,
      progress: false,
      result,
      updateTime: Date.now(),
    }));
  },

  setProgress: (tab: TabInfo, progress: boolean) => {
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
  getResult: (tab: TabInfo) => {
    const ret = get();
    if (!checkSameTab(tab, ret)) return null;

    const timeout = useUiStore.getState().fileSearchResultDisplayTimeoutMs;
    const delay = Date.now() - ret.updateTime;
    if (timeout < delay) return null;

    return ret.result;
  },

  isProgress: (tab: TabInfo) => {
    const ret = get();
    if (!checkSameTab(tab, ret)) return false;
    return ret.progress;
  },
}));

function checkSameTab(currentTab: TabInfo, ret: FileSearchResultStore): boolean {
  if (currentTab.id !== ret.tab?.id) return false;
  if (currentTab.refreshCount !== ret.tab?.refreshCount) return false;
  return true;
}
