import { create } from 'zustand';

import { GetFilesPropertyNotifyEvent } from '@/lib/bindings';
import { FileOperationDialogType } from '@/components/misc/FileOperationDialog';
import { DirEntry } from '@/lib/bindings-wrapper';

export type TaskId = number & { readonly __brand: unique symbol };

// Rustの get_files_property() を呼んだ後に通知されるデータを格納する
export interface GetFilesPropertyStore {
  type: FileOperationDialogType | null;
  taskId: TaskId | null;
  files: DirEntry[];
  property: GetFilesPropertyNotifyEvent | null;

  init: (files: DirEntry[], taskId: TaskId, type: FileOperationDialogType) => void;
  setProperty: (val: GetFilesPropertyNotifyEvent) => void;
}

export const useGetFilesPropertyStore = create<GetFilesPropertyStore>()((set, get) => ({
  type: null,
  taskId: null,
  files: [],
  property: null,

  init: (files: DirEntry[], taskId: TaskId, type: FileOperationDialogType) => {
    set(() => {
      return { taskId, type, files, property: null };
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
