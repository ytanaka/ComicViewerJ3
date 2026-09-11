import { PreferenceDialogTabId } from '@/components/preferences/PreferencesDialog';
import { create } from 'zustand';

// localStrage に保存しないUIの状態
export interface UiVolatileStore {
  // アプリケーションが初期化済みフラグ
  appInitialized: boolean;

  // 設定ダイアログ表示フラグ
  showPreferencesDialog: boolean;
  // 設定ダイアログを開いたときの選択タブ
  preferenceDialogTabId: PreferenceDialogTabId;
}

type UiVolatileStore_and_Action = UiVolatileStore & {
  setField: <K extends keyof UiVolatileStore>(key: K, value: UiVolatileStore[K]) => void;
};

export const useUiVolatileStore = create<UiVolatileStore_and_Action>()(set => ({
  appInitialized: false,
  showPreferencesDialog: false,
  preferenceDialogTabId: 'general',

  setField: (key, value) => set({ [key]: value }),
}));
