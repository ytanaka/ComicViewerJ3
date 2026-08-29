import { create } from 'zustand';
import { TabId } from './tab/types';
import { FileSearchResult } from '@/lib/bindings';
import { useUiStore } from './ui-store';

export interface FileSearchResultStore {
  tabId: TabId | null;
  result: FileSearchResult | null;
  resultTime: number;

  setResult: (tabId: TabId, result: FileSearchResult) => void;
  getResult: (tabId: TabId) => FileSearchResult | null;
}

export const useSearchResultStore = create<FileSearchResultStore>()((set, get) => ({
  tabId: null,
  result: null,
  resultTime: 0,

  setResult: (tabId: TabId, result: FileSearchResult) => {
    set(() => ({
      tabId, result, resultTime: Date.now()
    }))
  },

  getResult: (tabId: TabId) => {
    if (tabId !== get().tabId) return null;

    const timeout = useUiStore.getState().fileSearchResultDisplayTimeoutMs;
    const delay = Date.now() - get().resultTime;
    if (timeout < delay) return null;

    return get().result;
  },
}));
