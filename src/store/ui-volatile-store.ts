import { PreferenceDialogTabId } from '@/components/preferences/PreferencesDialog';
import { create } from 'zustand';

// localStrage に保存しないUIの状態
export interface UiVolatileStore {
  // アプリケーションが初期化済みフラグ
  appInitialized: boolean;

  // 設定ダイアログ表示フラグ
  showPreferencesDialog: boolean;
  preferenceDialogTabId: PreferenceDialogTabId;

  setAppInitialized: () => void;
  setShowPreferencesDialog: (b: boolean) => void;
  setPreferenceDialogTabId: (id: PreferenceDialogTabId) => void;
}

export const useUiVolatileStore = create<UiVolatileStore>()(set => ({
  appInitialized: false,
  showPreferencesDialog: false,
  preferenceDialogTabId: 'general',

  setAppInitialized: () => {
    set(() => {
      return { appInitialized: true };
    });
  },
  setShowPreferencesDialog: (b: boolean) => {
    set(() => {
      return { showPreferencesDialog: b };
    });
  },
  setPreferenceDialogTabId: (id: PreferenceDialogTabId) => {
    set(() => {
      return { preferenceDialogTabId: id };
    });
  },
}));
