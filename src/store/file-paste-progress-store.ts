import { create } from 'zustand';

import { FilePasteNotifyEvent, RemoveFilesNotifyEvent } from '@/lib/bindings';
import { DirEntry, TabInfo, TaskId } from '@/lib/bindings-wrapper';
import { useUiVolatileStore } from './ui-volatile-store';

// Rustの file_paste_from_clipboard() を呼んだ後に通知されるデータを格納する
export interface FilePasteProgressStore {
  tab: TabInfo | null;
  files: DirEntry[];
  taskId: TaskId | null;
  resolve: ((value: boolean) => void) | null;

  event: FilePasteNotifyEvent | null;

  showDialog: (
    tab: TabInfo,
    files: DirEntry[],
    taskId: TaskId,
    resolve: (value: boolean) => void,
  ) => void;
  setNotifyEvent: (ev: RemoveFilesNotifyEvent) => void;
}

export const useFilePasteProgressStore = create<FilePasteProgressStore>()((set, get) => ({
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
  ) => {
    useUiVolatileStore.getState().setField('showFilePasteProgressDialog', true);

    set(() => {
      return { tab, files, taskId, resolve, event: null };
    });
  },

  setNotifyEvent: (ev: RemoveFilesNotifyEvent) => {
    if (get().taskId !== ev.task_id) {
      console.error(`invalid task_id: current task_id = ${get().taskId}`, ev);
      return;
    }
    set(state => {
      return { ...state, event: ev };
    });
  },
}));
