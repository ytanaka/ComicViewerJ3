import { create } from 'zustand';

// ファイルリストのフォーカス位置が変化したときにスクロールさせる動作を制御する
// ※ レンダー毎にスクロールさせるとスクロールバーでスクロールできなくなるので、
//    フォーカス移動時のみスクロールするように管理する
export interface ScrollToFocusStore {
  doScroll: boolean;

  setScroll: (doScroll: boolean) => void;
}

export const useScrollToFocusStore = create<ScrollToFocusStore>()(set => ({
  doScroll: false,

  setScroll: (doScroll: boolean) => set({ doScroll }),
}));
