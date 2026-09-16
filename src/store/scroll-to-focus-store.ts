import { create } from 'zustand';

// ファイルリストのフォーカス位置の微調整
// タブ内のファイル一覧が更新された直後に virtuoso の scrollIntoView を呼んでもスクロールできないので少し遅延させるためのフラグ
export interface ScrollToFocusStore {
  needScroll: boolean;

  setNeedScroll: (on: boolean) => void;
}

export const useScrollToFocusStore = create<ScrollToFocusStore>()(set => ({
  needScroll: false,

  setNeedScroll: (on: boolean) => set({ needScroll: on }),
}));
