import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../ui/dialog';
import { FileProgressPanel } from './utils/FileProgressPanel';
import { useFilePasteProgressStore } from '@/store/tauri-event/file-paste-progress-store';
import { useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { TaskEventFileProgress } from '@/lib/bindings';

// ファイルをコピー、移動している最中に表示するダイアログ
// 途中で重複ファイルがあったときに問い合わせが来るので、AlertDialogで応答する。
// そのため、このダイアログは Dialog で作成する
export function FilePasteProgressDialog() {
  const showFilePasteProgressDialog = useUiVolatileStore(state => state.showFilePasteProgressDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFilePasteProgressStore(state => state);
  const event = dialogState.event;
  const error_msg = event?.head.error_msg;
  const isCopy = event?.is_copy === true;
  const endPrepare = event?.progress.files ?? 0 !== 0;

  let title;
  if (endPrepare) {
    if (isCopy) title = 'コピー中';
    else title = '移動中';
  } else {
    if (isCopy) title = 'コピー準備中';
    else title = '移動準備中';
  }

  const handleOkCancel = useCallback(
    (b: boolean) => {
      setField('showFilePasteProgressDialog', false);
      if (dialogState.resolve) {
        dialogState.resolve(b);
      }
    },
    [dialogState, setField]
  );

  function getProgress() {
    if (!endPrepare || !event) return 0;
    const FILE_OVERHEAD = 8 * 1024; // 0バイトのファイルをコピーするのにもオーバーヘッドがあるとみなす
    function sum(p: TaskEventFileProgress) {
      return p.size + (p.dires + p.files) * FILE_OVERHEAD + FILE_OVERHEAD; // divide by zero を防ぐ
    }
    return (sum(event.progress) / sum(event.prepare_progress)) * 100;
  }

  useEffect(() => {
    if (event?.head.finished !== true) return;
    if (error_msg) return;

    handleOkCancel(true);
  }, [event?.head.finished, error_msg, handleOkCancel]);

  return (
    <Dialog
      open={showFilePasteProgressDialog}
      onOpenChange={open => {
        if (!open) handleOkCancel(false);
      }}
    >
      <DialogContent>
        <DialogHeader>{title}</DialogHeader>

        {endPrepare ? (
          <>
            {isCopy && <Progress value={getProgress()} />}
            <FileProgressPanel header={event?.head} progress={event?.progress} />
          </>
        ) : (
          <FileProgressPanel header={event?.head} progress={event?.prepare_progress} />
        )}

        <DialogFooter>
          <Button onClick={() => handleOkCancel(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
