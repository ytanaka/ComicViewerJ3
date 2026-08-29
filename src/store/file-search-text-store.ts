import { create } from "zustand";

export interface FileSearchTextStore {
  text: string;
  prevTypeTime: number; // Unix time

  addText: (c: string) => void;
  clear: () => void;
}

export const useSearchTextStore = create<FileSearchTextStore>()(set => ({
  text: "",
  prevTypeTime: 0,

  addText: (c: string) => {
    set(state => ({ text: state.text + c, prevTypeTime: performance.now() }))
  },

  clear: () => {
    set(() => ({ text: "", prevTypeTime: 0 }))
  },
}));
