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
import { useFileOperationProgressStore } from '@/store/file-operation-progress-store';
import { useEffect } from 'react';

// ダイアログの表示モード
export type FileOperationProgressDialogType = 'remove' | 'copy';

export function FileOperationProgressDialog() {
  const show = useUiVolatileStore(state => state.showFileOperationProgressDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFileOperationProgressStore(state => state);
  const type = dialogState.type;

  function handleOkCancel(b: boolean) {
    setField('showFileOperationProgressDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(b);
    }
  }

  function getTitle() {
    switch (type) {
      case 'copy':
        return 'コピー';
      case 'remove':
        return '削除';
      default:
        return '???';
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
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
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
