import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { useFileDeleteProgressStore } from '@/store/file-delete-progress-store';
import { useEffect } from 'react';
import { Progress } from '../ui/progress';

export function FileDeleteProgressDialog() {
  const show = useUiVolatileStore(state => state.showFileDeleteProgressDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFileDeleteProgressStore(state => state);
  function getProgress() {
    const ev = dialogState.event;
    const pre = dialogState.prepareEvent;
    if (!ev || !pre) return 0;
    return Math.floor(ev.files / pre.files * 100);
  }

  function handleOkCancel(b: boolean) {
    setField('showFileDeleteProgressDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(b);
    }
  }

  useEffect(() => {
    if (dialogState.event?.finished !== true) return;

  }, [dialogState.event?.finished])

  return (
    <AlertDialog
      open={show}
      onOpenChange={open => {
        if (!open) handleOkCancel(false)
      }}
    >
      <AlertDialogContent className="max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>削除中</AlertDialogTitle>
        </AlertDialogHeader>

        <Progress value={getProgress()} />
        <div>


        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => handleOkCancel(false)}
          >Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
