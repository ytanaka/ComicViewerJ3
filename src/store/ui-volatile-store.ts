import { create } from 'zustand';

// localStrage に保存しないUIの状態
export interface UiVolatileStore {
  // アプリケーションが初期化済みフラグ
  appInitialized: boolean;

  // 現在のシステムのフルスクリーン状態
  isFullscreen: boolean;
  // 画像表示モード時にフルスクリーンにするかどうか
  shouldFullscreenWhenImageView: boolean;
  // フルスクリーン初回表示時の警告表示したかどうか
  isFullscreenUsageShown: boolean;

  // 設定ダイアログ表示フラグ
  showPreferencesDialog: boolean;

  // ブックマーク設定画面表示フラグ
  showBookmarkManager: boolean;

  // OK Cancel ダイアログ
  showOkCancelDialog: boolean;
}

type UiVolatileStore_and_Action = UiVolatileStore & {
  setField: <K extends keyof UiVolatileStore>(key: K, value: UiVolatileStore[K]) => void;
};

export const useUiVolatileStore = create<UiVolatileStore_and_Action>()(set => ({
  appInitialized: false,
  showPreferencesDialog: false,
  isFullscreen: false,
  isFullscreenUsageShown: false,
  shouldFullscreenWhenImageView: false,
  showBookmarkManager: false,
  showOkCancelDialog: false,

  setField: (key, value) => set({ [key]: value }),
}));
