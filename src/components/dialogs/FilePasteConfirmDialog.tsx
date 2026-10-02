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
import { TaskConfirm, TaskResponse } from '@/lib/bindings';
import { useCallback, useEffect, useState } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

export function FilePasteConfirmDialog() {
  const show = useUiVolatileStore(state => state.showFilePasteConfirmDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFilePasteConfirmDialogStore(state => state);
  const event = dialogState.event;
  const mode_copy = event?.args[0] === 'copy';
  const src_path = event?.args[1];
  const dst_dir = event?.args[2];

  const [always, setAlways] = useState(false);

  useEffect(() => {
    if (!show) return;
    Promise.resolve().then(() => {
      setAlways(false);
    });
  }, [show]);

  const handleAnswer = useCallback(
    (res: TaskResponse) => {
      setField('showFilePasteConfirmDialog', false);
      if (dialogState.resolve) {
        dialogState.resolve(res);
      }
    },
    [dialogState, setField]
  );

  const mkRes = useCallback(
    (t: string): TaskResponse => {
      return {
        task_id: event?.task_id ?? -999,
        t: 'Paste',
        args: [t, '' + always],
      };
    },
    [always, event?.task_id]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 's') {
        handleAnswer(mkRes('Skip'));
      } else if (e.key === 'r') {
        handleAnswer(mkRes('Rename'));
      } else if (e.key === 'w') {
        handleAnswer(mkRes('Merge'));
      } else if (e.key === 'a') {
        setAlways(prev => !prev);
      } else {
        return;
      }
      e.preventDefault();
    },
    [handleAnswer, mkRes]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AlertDialog
      open={show}
      onOpenChange={open => {
        if (!open) handleAnswer(mkRes('Cancel'));
      }}
    >
      <AlertDialogContent className="max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>{mode_copy ? 'コピー' : '移動'}確認</AlertDialogTitle>
        </AlertDialogHeader>

        <div>
          <div>
            元: {src_path}
            <br />
            先: {dst_dir}
            <br />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={() => handleAnswer(mkRes('Cancel'))} autoFocus={true} className="mr-7">
            キャンセル
          </AlertDialogAction>

          <div className="flex items-center" title="ONにすると、この処理中は再度尋ねない">
            <Label htmlFor="sw_always">常に(A)</Label>
            <Switch id="sw_always" className="ml-2" checked={always} onCheckedChange={setAlways} />
          </div>

          <AlertDialogAction
            title="同じ名前のファイル、ディレクトリは何もしない"
            onClick={() => handleAnswer(mkRes('Skip'))}
          >
            スキップ(S)
          </AlertDialogAction>

          <AlertDialogAction
            title="同じ名前のファイル、ディレクトリは別名にする"
            onClick={() => handleAnswer(mkRes('Rename'))}
          >
            リネーム(R)
          </AlertDialogAction>

          <AlertDialogAction
            title="同じ名前のファイルは上書き"
            onClick={() => handleAnswer(mkRes('Merge'))}
            hidden={!mode_copy}
          >
            上書き(W)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface FilePasteConfirmDialogStore {
  event: TaskConfirm | null;
  resolve: ((value: TaskResponse) => void) | null;

  showDialog: (event: TaskConfirm, resolve: (value: TaskResponse) => void) => void;
}
export const useFilePasteConfirmDialogStore = create<FilePasteConfirmDialogStore>()(set => ({
  event: null,
  resolve: null,

  showDialog: (event: TaskConfirm, resolve: (value: TaskResponse) => void) => {
    useUiVolatileStore.getState().setField('showFilePasteConfirmDialog', true);

    set(() => {
      return {
        event,
        resolve,
      };
    });
  },
}));
