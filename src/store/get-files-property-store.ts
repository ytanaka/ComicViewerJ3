import { create } from 'zustand';

import { GetFilesPropertyNotifyEvent } from '@/lib/bindings';
import { FileOperationDialogType } from '@/components/dialogs/FileOperationDialog';
import { DirEntry, TabInfo } from '@/lib/bindings-wrapper';
import { useUiVolatileStore } from './ui-volatile-store';

export type TaskId = number & { readonly __brand: unique symbol };

// Rustの get_files_property() を呼んだ後に通知されるデータを格納する
export interface GetFilesPropertyStore {
  tab: TabInfo | null,
  files: DirEntry[];
  type: FileOperationDialogType | null;
  taskId: TaskId | null;
  resolve: ((value: boolean) => void) | null;

  property: GetFilesPropertyNotifyEvent | null;

  showDialog: (tab: TabInfo, files: DirEntry[], taskId: TaskId, type: FileOperationDialogType, resolve: (value: boolean) => void) => void;
  setProperty: (val: GetFilesPropertyNotifyEvent) => void;
}

export const useGetFilesPropertyStore = create<GetFilesPropertyStore>()((set, get) => ({
  tab: null,
  files: [],
  type: null,
  taskId: null,
  resolve: null,

  property: null,

  showDialog: (tab: TabInfo, files: DirEntry[], taskId: TaskId, type: FileOperationDialogType, resolve: (value: boolean) => void) => {
    useUiVolatileStore.getState().setField('showFileOperationDialog', true);

    set(() => {
      return { tab, files, taskId, type, resolve, property: null, };
    });
  },
  setProperty: (val: GetFilesPropertyNotifyEvent) => {
    if (get().taskId !== val.task_id) {
      console.error(`invalid task_id: current task_id = ${get().taskId}`, val);
      return;
    }
    console.debug('received event GetFilesPropertyNotifyEvent: ', val);
    set(state => {
      return { ...state, property: val };
    });
  },
}));
