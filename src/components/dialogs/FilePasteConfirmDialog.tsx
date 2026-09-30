import { create } from 'zustand';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { FilePasteConfirmEvent, TaskResponse } from '@/lib/bindings';
import { useState } from 'react';
import { Switch } from '../ui/switch';
import { TaskAnswer_type } from '@/lib/bindings-wrapper';

export function FilePasteConfirmDialog() {
  const show = useUiVolatileStore(state => state.showFilePasteConfirmDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFilePasteConfirmDialogStore(state => state);
  const event = dialogState.event;

  const [always, setAlways] = useState(false);

  function handleAnswer(res: TaskResponse) {
    setField('showFilePasteConfirmDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(res);
    }
  }

  function mkRes(t: TaskAnswer_type) {
    return { answer: { type: t }, always };
  }

  return (
    <AlertDialog
      open={show}
      onOpenChange={open => {
        if (!open) handleAnswer(mkRes('Cancel'));
      }}
    >
      <AlertDialogContent className="max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>確認</AlertDialogTitle>
        </AlertDialogHeader>

        <div>
          <div>
            元: {event?.src_path}
            <br />
            先: {event?.dst_dir}
            <br />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={() => handleAnswer(mkRes('Cancel'))}>キャンセル</AlertDialogAction>
          常に
          <Switch onCheckedChange={setAlways} />
          <AlertDialogAction onClick={() => handleAnswer(mkRes('Skip'))}>スキップ</AlertDialogAction>
          <AlertDialogAction onClick={() => handleAnswer(mkRes('Rename'))}>リネーム</AlertDialogAction>
          <AlertDialogAction onClick={() => handleAnswer(mkRes('Merge'))} hidden={event?.mode.type !== 'Copy'}>
            マージ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface FilePasteConfirmDialogStore {
  event: FilePasteConfirmEvent | null;
  resolve: ((value: TaskResponse) => void) | null;

  showDialog: (event: FilePasteConfirmEvent, resolve: (value: TaskResponse) => void) => void;
}
export const useFilePasteConfirmDialogStore = create<FilePasteConfirmDialogStore>()(set => ({
  event: null,
  resolve: null,

  showDialog: (event: FilePasteConfirmEvent, resolve: (value: TaskResponse) => void) => {
    useUiVolatileStore.getState().setField('showFilePasteConfirmDialog', true);

    set(() => {
      return {
        event,
        resolve,
      };
    });
  },
}));
