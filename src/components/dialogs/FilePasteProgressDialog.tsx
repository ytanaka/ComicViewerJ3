import { useUiVolatileStore } from "@/store/ui-volatile-store";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "../ui/dialog";
import { FileProgressPanel } from "./utils/FileProgressPanel";
import { useFilePasteProgressStore } from "@/store/tauri-event/file-paste-progress-store";
import { useCallback, useEffect } from "react";
import { Button } from "../ui/button";

// ファイルをコピー、移動している最中に表示するダイアログ
// 途中で重複ファイルがあったときに問い合わせが来るので、AlertDialogで応答する。
// そのため、このダイアログは Dialog で作成する
export function FilePasteProgressDialog() {
  const showFilePasteProgressDialog = useUiVolatileStore(state => state.showFilePasteProgressDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useFilePasteProgressStore(state => state);
  const event = dialogState.event;
  const error_msg = event?.head.error_msg;
  const isCopy = dialogState.isCopy;

  const handleOkCancel = useCallback(
    (b: boolean) => {
      setField('showFilePasteProgressDialog', false);
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
    <Dialog
      open={showFilePasteProgressDialog}
      onOpenChange={open => {
        if (!open) handleOkCancel(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          {isCopy ? 'コピー' : '移動'}中
        </DialogHeader>

        <FileProgressPanel header={event?.head} progress={event?.progress} />

        <DialogFooter>
          <Button onClick={() => handleOkCancel(false)} >Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
