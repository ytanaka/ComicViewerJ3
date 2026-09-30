import { useUiVolatileStore } from "@/store/ui-volatile-store";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { FileProgressPanel } from "./utils/FileProgressPanel";

export function FilePasteProgressDialog() {
  const showFilePasteProgressDialog = useUiVolatileStore(state => state.showFilePasteProgressDialog);
  const setVolatileField = useUiVolatileStore(state => state.setField);



  return (
    <Dialog open={showFilePasteProgressDialog} onOpenChange={b => setVolatileField('showFilePasteProgressDialog', b)}>
      <DialogContent>
        <DialogHeader>
          ファイルコピー中
        </DialogHeader>

        <FileProgressPanel />
      </DialogContent>
    </Dialog>
  );
}
