import { create } from 'zustand';

// ファイル一覧画面でローマ字入力をしている途中の文字列を格納する
export interface FileSearchTextStore {
  text: string;
  prevTypeTime: number; // Unix time

  addText: (c: string) => void;
  clearText: () => void;
  cancelInput: () => void;
}

export const useSearchTextStore = create<FileSearchTextStore>()(set => ({
  text: '',
  prevTypeTime: 0,

  addText: (c: string) => {
    set(state => ({ text: state.text + c, prevTypeTime: performance.now() }));
  },

  clearText: () => {
    set(() => ({ text: '', prevTypeTime: 0 }));
  },

  cancelInput: () => {
    set(() => ({ prevTypeTime: 0 }));
  },
}));
