import { create } from 'zustand';

// ファイルリストのスクロール機能の仮想化
export interface ListScrollHandlerStore {
  doScroll: ((fileIndex: number) => void) | null;
  setScrollHandler: (fn: (fileIndex: number) => void) => void;
}

export const useListScrollHandlerStore = create<ListScrollHandlerStore>()(set => ({
  doScroll: null,
  setScrollHandler: (fn: (fileIndex: number) => void) => {
    set({ doScroll: fn });
  },
}));
