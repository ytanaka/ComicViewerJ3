import { useCallback, useEffect } from 'react';

import { Progress } from '../ui/progress';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { useFileDeleteProgressStore } from '@/store/file-delete-progress-store';
import { FileProgressPanel } from './utils/FileProgressPanel';

export function FileDeleteProgressDialog() {
  const show = useUiVolatileStore(state => state.showFileDeleteProgressDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFileDeleteProgressStore(state => state);
  const event = dialogState.event;
  const error_msg = event?.head.error_msg;

  function getProgress() {
    const pre = dialogState.prepareEvent;
    if (!event || !pre) return 0;
    return Math.floor((event.progress.files / pre.progress.files) * 100);
  }

  const handleOkCancel = useCallback(
    (b: boolean) => {
      setField('showFileDeleteProgressDialog', false);
      if (dialogState.resolve) {
        dialogState.resolve(b);
      }
    },
    [dialogState, setField]
  );

  useEffect(() => {
    if (event?.head.finished !== true) return;
    if (error_msg) return;

    handleOkCancel(true);
  }, [event?.head.finished, error_msg, handleOkCancel]);

  return (
    <AlertDialog
      open={show}
      onOpenChange={open => {
        if (!open) handleOkCancel(false);
      }}
    >
      <AlertDialogContent className="max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>削除中</AlertDialogTitle>
        </AlertDialogHeader>

        <Progress value={getProgress()} />
        <AlertDialogDescription>
          <FileProgressPanel header={event?.head} progress={event?.progress} />
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleOkCancel(false)}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
