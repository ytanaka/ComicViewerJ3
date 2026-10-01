import { create } from 'zustand';

import { FilePasteNotifyEvent } from '@/lib/bindings';
import { TabInfo, TaskId } from '@/lib/bindings-wrapper';
import { useUiVolatileStore } from '../ui-volatile-store';

// Rustの file_paste_from_clipboard() を呼んだ後に通知されるデータを格納する
export interface FilePasteProgressStore {
  tab: TabInfo | null; // TODO いるか？
  taskId: TaskId | null;
  resolve: ((value: boolean) => void) | null;

  event: FilePasteNotifyEvent | null;

  showDialog: (tab: TabInfo, taskId: TaskId, resolve: (value: boolean) => void) => void;
  closeDialog: () => void;

  setNotifyEvent: (ev: FilePasteNotifyEvent) => void;
}

export const useFilePasteProgressStore = create<FilePasteProgressStore>()((set, get) => ({
  tab: null,
  taskId: null,
  resolve: null,

  prepareEvent: null,
  event: null,

  showDialog: (tab: TabInfo, taskId: TaskId, resolve: (value: boolean) => void) => {
    useUiVolatileStore.getState().setField('showFilePasteProgressDialog', true);

    set(() => {
      return { tab, taskId, resolve, event: null };
    });
  },
  closeDialog: () => {
    useUiVolatileStore.getState().setField('showFilePasteProgressDialog', false);
  },

  setNotifyEvent: (ev: FilePasteNotifyEvent) => {
    if (get().taskId !== ev.task_id) {
      console.error(`FilePasteProgressStore: invalid task_id: current task_id = ${get().taskId}`, ev);
      return;
    }
    set(state => {
      return { ...state, event: ev };
    });
  },
}));
