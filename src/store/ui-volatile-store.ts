import { create } from 'zustand';

// localStrage に保存しないUIの状態
export interface UiVolatileStore {
  // アプリケーションが初期化済みフラグ
  appInitialized: boolean;

  // 設定ダイアログ表示フラグ
  showPreferencesDialog: boolean;

  setAppInitialized: () => void;
  setShowPreferencesDialog: (b: boolean) => void;
}

export const useUiVolatileStore = create<UiVolatileStore>()(
  set => ({
    appInitialized: false,
    showPreferencesDialog: false,

    setAppInitialized: () => {
      set(() => { return { appInitialized: true }; });
    },
    setShowPreferencesDialog: (b: boolean) => {
      set(() => { return { showPreferencesDialog: b }; });
    },
  })
);
