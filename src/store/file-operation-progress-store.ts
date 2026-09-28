import { create } from 'zustand';

import { GetFilesPropertyNotifyEvent } from '@/lib/bindings';
import { DirEntry, TabInfo, TaskId } from '@/lib/bindings-wrapper';
import { useUiVolatileStore } from './ui-volatile-store';
import { FileOperationProgressDialogType } from '@/components/dialogs/FileOperationProgressDialog';

// Rustの get_files_property() を呼んだ後に通知されるデータを格納する
export interface FileOperationProgressStore {
  tab: TabInfo | null,
  files: DirEntry[];
  type: FileOperationProgressDialogType | null;
  taskId: TaskId | null;
  resolve: ((value: boolean) => void) | null;

  event: GetFilesPropertyNotifyEvent | null;

  showDialog: (tab: TabInfo, files: DirEntry[], taskId: TaskId, type: FileOperationProgressDialogType, resolve: (value: boolean) => void) => void;
  setNotifyEvent: (ev: GetFilesPropertyNotifyEvent) => void;
}

export const useFileOperationProgressStore = create<FileOperationProgressStore>()((set, get) => ({
  tab: null,
  files: [],
  type: null,
  taskId: null,
  resolve: null,

  event: null,

  showDialog: (tab: TabInfo, files: DirEntry[], taskId: TaskId, type: FileOperationProgressDialogType, resolve: (value: boolean) => void) => {
    useUiVolatileStore.getState().setField('showFileOperationProgressDialog', true);

    set(() => {
      return { tab, files, taskId, type, resolve, event: null, };
    });
  },

  setNotifyEvent: (ev: GetFilesPropertyNotifyEvent) => {
    if (get().taskId !== ev.task_id) {
      console.error(`invalid task_id: current task_id = ${get().taskId}`, ev);
      return;
    }
    console.debug('received event GetFilesPropertyNotifyEvent: ', ev);
    set(state => {
      return { ...state, event: ev };
    });
  },
}));
