import { create } from 'zustand';

// ファイルリストのフォーカス位置が変化したときにスクロールさせる動作を制御する
// ※ レンダー毎にスクロールさせるとスクロールバーでスクロールできなくなるので、
//    フォーカス移動時のみスクロールするように管理する
export interface ScrollToFocusState {
  doScroll: boolean;

  setScroll: (doScroll: boolean) => void;
}

export const useScrollToFocusState = create<ScrollToFocusState>()(set => ({
  doScroll: false,

  setScroll: (doScroll: boolean) => set({ doScroll }),
}));
