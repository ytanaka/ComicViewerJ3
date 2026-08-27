import { create } from "zustand";

// ファイルリストへフォーカス移動させるためのフラグ
// ※ メニューが開いたとき、メニューにフォーカスが移ってファイルリストがキーボードで操作できなくなることの対策
export interface FocusState {
  getFocus: boolean;

  setFocus: () => void;
  doneFocus: () => void;
}

export const useFocusState = create<FocusState>()(
  (set) => ({
    getFocus: false,

    setFocus: () => set({ getFocus: true }),
    doneFocus: () => set({ getFocus: false }),
  }),
);
