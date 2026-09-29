import { create } from 'zustand';

import { GetFilesPropertyNotifyEvent } from '@/lib/bindings';
import { PrepareFileOperationDialogType } from '@/components/dialogs/PrepareFileOperationDialog';
import { DirEntry, TabInfo, TaskId } from '@/lib/bindings-wrapper';
import { useUiVolatileStore } from './ui-volatile-store';

// Rustの get_files_property() を呼んだ後に通知されるデータを格納する
export interface PrepareFileOperationStore {
  tab: TabInfo | null;
  files: DirEntry[];
  type: PrepareFileOperationDialogType | null;
  taskId: TaskId | null;
  resolve: ((value: boolean) => void) | null;

  event: GetFilesPropertyNotifyEvent | null;

  showDialog: (
    tab: TabInfo,
    files: DirEntry[],
    taskId: TaskId,
    type: PrepareFileOperationDialogType,
    resolve: (value: boolean) => void
  ) => void;
  setNotifyEvent: (ev: GetFilesPropertyNotifyEvent) => void;
}

export const usePrepareFileOperationStore = create<PrepareFileOperationStore>()((set, get) => ({
  tab: null,
  files: [],
  type: null,
  taskId: null,
  resolve: null,

  event: null,

  showDialog: (
    tab: TabInfo,
    files: DirEntry[],
    taskId: TaskId,
    type: PrepareFileOperationDialogType,
    resolve: (value: boolean) => void
  ) => {
    useUiVolatileStore.getState().setField('showPrepareFileOperationDialog', true);

    set(() => {
      return { tab, files, taskId, type, resolve, event: null };
    });
  },

  setNotifyEvent: (ev: GetFilesPropertyNotifyEvent) => {
    if (get().taskId !== ev.task_id) {
      console.error(`invalid task_id: current task_id = ${get().taskId}`, ev);
      return;
    }
    set(state => {
      return { ...state, event: ev };
    });
  },
}));
