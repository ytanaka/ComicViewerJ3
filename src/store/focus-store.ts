import { create } from 'zustand';

// ファイルリストへフォーカス移動させるためのフラグ
// ※ メニューが開いたとき、メニューにフォーカスが移ってファイルリストがキーボードで操作できなくなることの対策
export interface FocusStore {
  getFocus: boolean;

  setFocus: () => void;
  doneFocus: () => void;
}

export const useFocusStore = create<FocusStore>()(set => ({
  getFocus: false,

  setFocus: () => set({ getFocus: true }),
  doneFocus: () => set({ getFocus: false }),
}));
