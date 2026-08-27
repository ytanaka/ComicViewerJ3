import { create } from 'zustand';

export enum ScrollLevel {
  No = 0,
  Normal = 1,
  Lazy = 2,
}

// ファイルリストのフォーカス位置が変化したときにスクロールさせる動作を制御する
// ※ レンダー毎にスクロールさせるとスクロールバーでスクロールできなくなるので、
//    フォーカス移動時のみスクロールするように管理する
export interface ScrollToFocusState {
  scrollLevel: ScrollLevel;

  setScroll: (level: ScrollLevel) => void;
}

export const useScrollToFocusState = create<ScrollToFocusState>()(set => ({
  scrollLevel: 0,

  setScroll: (level: ScrollLevel) => set({ scrollLevel: level }),
}));
