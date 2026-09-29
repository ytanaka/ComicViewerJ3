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
import { formatFileBytes } from '@/lib/tools/string-util';

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

  const handleOkCancel = useCallback((b: boolean) => {
    setField('showFileDeleteProgressDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(b);
    }
  }, [dialogState, setField]);

  useEffect(() => {
    if (dialogState.event?.finished !== true) return;
    handleOkCancel(true);
  }, [dialogState.event?.finished, handleOkCancel])

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
        <AlertDialogDescription>
          削除サイズ: {formatFileBytes(dialogState.event?.size ?? 0)}({dialogState.event?.size}バイト)<br />
          削除ファイル: {dialogState.event?.files}<br />
          削除ディレクトリ: {dialogState.event?.dires}<br />
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => handleOkCancel(false)}
          >Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
