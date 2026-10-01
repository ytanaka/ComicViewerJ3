import { useInputDialogStore } from '@/components/dialogs/InputDialog';
import { useOkCancelDialogStore } from '@/components/dialogs/OkCancelDialog';
import { usePrepareFileOperationStore } from '@/store/tauri-event/prepare-file-operation-store';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { DirEntry, TabInfo, TaskId } from '../bindings-wrapper';
import { GetFilesPropertyNotifyEvent, TaskConfirm, TaskResponse } from '../bindings';
import { useFileDeleteProgressStore } from '@/store/tauri-event/file-delete-progress-store';
import { useFilePasteProgressStore } from '@/store/tauri-event/file-paste-progress-store';
import { useFilePasteConfirmDialogStore } from '@/components/dialogs/FilePasteConfirmDialog';

export const dialogCommands = {
  // 現在ダイアログが開いているか判定
  isOpenAnyDialog() {
    return (
      useUiVolatileStore.getState().showPreferencesDialog ||
      useUiVolatileStore.getState().showBookmarkManager ||
      useUiVolatileStore.getState().showOkCancelDialog ||
      useUiVolatileStore.getState().showInputDialog ||
      useUiVolatileStore.getState().showPrepareFileOperationDialog ||
      useUiVolatileStore.getState().showFileDeleteProgressDialog ||
      useUiVolatileStore.getState().showFilePasteProgressDialog ||
      useUiVolatileStore.getState().showFilePasteConfirmDialog
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

  showMsgDialog(title: string, msg: string) {
    useOkCancelDialogStore.getState().showDialogNoCancel(title, msg);
  },

  showInputDialog(title: string, msg: string, defaultValue: string): Promise<string | null> {
    return new Promise<string | null>(resolve => {
      useInputDialogStore.getState().showDialog(title, msg, defaultValue, resolve);
    });
  },

  // ---------------------- prepare file operation ----------------------
  showFilePropertyDialog(tab: TabInfo, file: DirEntry, taskId: TaskId): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      usePrepareFileOperationStore.getState().showDialog(tab, [file], taskId, 'property', resolve);
    });
  },
  showPrepareDeleteDialog(tab: TabInfo, files: DirEntry[], taskId: TaskId): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      usePrepareFileOperationStore.getState().showDialog(tab, files, taskId, 'prepare_remove', resolve);
    });
  },

  // ---------------------- file delete progress ----------------------
  showDeleteProgressDialog(
    tab: TabInfo,
    files: DirEntry[],
    taskId: TaskId,
    prepare: GetFilesPropertyNotifyEvent
  ): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      useFileDeleteProgressStore.getState().showDialog(tab, files, taskId, resolve, prepare);
    });
  },

  // ---------------------- file paste progress ----------------------
  showPasteProgresDialog(tab: TabInfo, taskId: TaskId): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      useFilePasteProgressStore.getState().showDialog(tab, taskId, resolve);
    });
  },
  closePasteProgresDialog() {
    useFilePasteProgressStore.getState().closeDialog();
  },

  showFilePasteConfirmDialog(ev: TaskConfirm): Promise<TaskResponse> {
    return new Promise<TaskResponse>(resolve => {
      useFilePasteConfirmDialogStore.getState().showDialog(ev, resolve);
    });
  },
};
