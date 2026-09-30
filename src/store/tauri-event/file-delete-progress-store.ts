import { create } from 'zustand';

import { GetFilesPropertyNotifyEvent, RemoveFilesNotifyEvent } from '@/lib/bindings';
import { DirEntry, TabInfo, TaskId } from '@/lib/bindings-wrapper';
import { useUiVolatileStore } from '../ui-volatile-store';

// Rustの remove_files() を呼んだ後に通知されるデータを格納する
export interface FileDeleteProgressStore {
  tab: TabInfo | null;
  files: DirEntry[];
  taskId: TaskId | null;
  resolve: ((value: boolean) => void) | null;

  prepareEvent: GetFilesPropertyNotifyEvent | null;
  event: RemoveFilesNotifyEvent | null;

  showDialog: (
    tab: TabInfo,
    files: DirEntry[],
    taskId: TaskId,
    resolve: (value: boolean) => void,
    prepareEvent: GetFilesPropertyNotifyEvent
  ) => void;
  setNotifyEvent: (ev: RemoveFilesNotifyEvent) => void;
}

export const useFileDeleteProgressStore = create<FileDeleteProgressStore>()((set, get) => ({
  tab: null,
  files: [],
  taskId: null,
  resolve: null,

  prepareEvent: null,
  event: null,

  showDialog: (
    tab: TabInfo,
    files: DirEntry[],
    taskId: TaskId,
    resolve: (value: boolean) => void,
    prepareEvent: GetFilesPropertyNotifyEvent
  ) => {
    useUiVolatileStore.getState().setField('showFileDeleteProgressDialog', true);

    set(() => {
      return { tab, files, taskId, resolve, event: null, prepareEvent };
    });
  },

  setNotifyEvent: (ev: RemoveFilesNotifyEvent) => {
    if (get().taskId !== ev.task_id) {
      console.error(`FileDeleteProgressStore: invalid task_id: current task_id = ${get().taskId}`, ev);
      return;
    }
    set(state => {
      return { ...state, event: ev };
    });
  },
}));
