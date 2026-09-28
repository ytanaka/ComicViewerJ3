import { AppConstants } from '@/lib/bindings';
import { create } from 'zustand';

// アプリ初期化時にRustから渡された定数
export interface AppConstantsStore {
  val: AppConstants | null;
  init: (v: AppConstants) => void;
}

export const useAppConstantsStore = create<AppConstantsStore>()(set => ({
  val: null,
  init: (v: AppConstants) => {
    set(() => ({ val: v }));
  },
}));
