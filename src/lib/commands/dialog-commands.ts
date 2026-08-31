import { useUiVolatileStore } from '@/store/ui-volatile-store';

export const dialogCommands = {
  // 現在ダイアログが開いているか判定
  isOpenAnyDialog() {
    return useUiVolatileStore.getState().showPreferencesDialog;
  },

  // 設定画面を開く
  openPreference() {
    useUiVolatileStore.getState().setShowPreferencesDialog(true);
  },
};
