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
import { useEffect } from 'react';

export function FileDeleteProgressDialog() {
  const show = useUiVolatileStore(state => state.showFileDeleteProgressDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFileDeleteProgressStore(state => state);

  function handleOkCancel(b: boolean) {
    setField('showFileDeleteProgressDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(b);
    }
  }

  useEffect(() => {
    if (dialogState.event?.finished !== true) return;

    // TODO
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
          <AlertDialogDescription className="max-w-full overflow-x-auto">
            xxxxxxxxxxxaaa
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => handleOkCancel(false)}
          >Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
