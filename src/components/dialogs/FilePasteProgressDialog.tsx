import { useUiVolatileStore } from "@/store/ui-volatile-store";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { FileProgressPanel } from "./utils/FileProgressPanel";
import { useFilePasteProgressStore } from "@/store/tauri-event/file-paste-progress-store";

// ファイルをコピー、移動している最中に表示するダイアログ
// 途中で重複ファイルがあったときに問い合わせが来るので、AlertDialogで応答する。
// そのため、このダイアログは Dialog で作成する
export function FilePasteProgressDialog() {
  const showFilePasteProgressDialog = useUiVolatileStore(state => state.showFilePasteProgressDialog);
  const setVolatileField = useUiVolatileStore(state => state.setField);

  const event = useFilePasteProgressStore(state => state.event);


  return (
    <Dialog open={showFilePasteProgressDialog} onOpenChange={b => setVolatileField('showFilePasteProgressDialog', b)}>
      <DialogContent>
        <DialogHeader>
          {event?.is_copy ? 'コピー' : '移動'}中
        </DialogHeader>
        <FileProgressPanel header={event?.head} progress={event?.progress} />
      </DialogContent>
    </Dialog>
  );
}
