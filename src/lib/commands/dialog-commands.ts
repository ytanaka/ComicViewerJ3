import { useOkCancelDialogStore } from '@/components/misc/OkCancelDialog';
import { useUiVolatileStore } from '@/store/ui-volatile-store';

export const dialogCommands = {
  // 現在ダイアログが開いているか判定
  isOpenAnyDialog() {
    return (
      useUiVolatileStore.getState().showPreferencesDialog ||
      useUiVolatileStore.getState().showBookmarkManager ||
      useUiVolatileStore.getState().showOkCancelDialog
    );
  },

  // 設定画面を開く
  openPreference() {
    useUiVolatileStore.getState().setField('showPreferencesDialog', true);
  },

  // ブックマーク画面を開く
  openBookmark() {
    useUiVolatileStore.getState().setField('showBookmarkManager', true);
  },
  closeBookmark() {
    useUiVolatileStore.getState().setField('showBookmarkManager', false);
  },

  showOkCancelDialog(title: string, msg: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      useOkCancelDialogStore.getState().showDialog(title, msg, resolve);
    });
  },
};
