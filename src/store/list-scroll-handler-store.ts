import { create } from 'zustand';

// ファイルリストのスクロール機能の仮想化
export interface ListScrollHandlerStore {
  rows: number;
  columns: number;
  doScroll: ((fileIndex: number) => void) | null;

  setRows: (n: number) => void;
  setColumns: (n: number) => void;
  setScrollHandler: (fn: ((fileIndex: number) => void) | null) => void;
}

export const useListScrollHandlerStore = create<ListScrollHandlerStore>()((set, get) => ({
  rows: 1,
  columns: 1,
  doScroll: null,

  setRows: (n: number) => {
    if (get().rows === n) return;
    console.log('useListScrollHandlerStore: rows changed(', get().rows, '=>', n, ')');
    set(state => ({ ...state, rows: n }));
  },
  setColumns: (n: number) => {
    if (get().columns === n) return;
    console.log('useListScrollHandlerStore: columns changed(', get().columns, '=>', n, ')');
    set(state => ({ ...state, columns: n }));
  },
  setScrollHandler: (fn: ((fileIndex: number) => void) | null) => {
    set({ doScroll: fn });
  },
}));
