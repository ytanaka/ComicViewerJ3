import { useEffect, useState } from "react";
import { join as tauri_join } from '@tauri-apps/api/path';

import { useUiVolatileStore } from "@/store/ui-volatile-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { InputGroup, InputGroupInput } from "../ui/input-group";
import { useTabStore } from "@/store/tab/store";
import { useCmdGetDirEntries } from "@/services/tab-dir-entry";
import { useBookmarkStore } from "@/store/bookmark-store";

export function BookmarkManager() {
  const showBookmarkManager = useUiVolatileStore(state => state.showBookmarkManager);
  const setVolatileField = useUiVolatileStore(state => state.setField);
  const tab = useTabStore(state => state.getCurrentTab()!);

  const { data: dirEntries } = useCmdGetDirEntries(tab.info);
  const [path, setPath] = useState<string | undefined>(undefined);

  const list = useBookmarkStore(state => state.list);
  const focusIndex = useBookmarkStore(state => state.focusIndex);
  const setFocus = useBookmarkStore(state => state.setFocus);

  useEffect(() => {
    const getPath = async () => {
      if (!tab) return;
      if (!dirEntries) return;

      const path = await tauri_join(tab.info.path, dirEntries[tab.selection.focusIndex].name);
      setPath(path);
    };
    getPath();
  }, [dirEntries, tab]);

  return (
    <Dialog open={showBookmarkManager} onOpenChange={b => setVolatileField('showBookmarkManager', b)}>
      <DialogContent className="w-[90vw]! max-w-[90vw]! h-[90vh] max-h-none flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div>
          <InputGroup className="w-full">
            <InputGroupInput
              value={path}
              onChange={e => setPath(e.target.value)}
            />
          </InputGroup>

          <h1>aaa</h1>
        </div>
      </DialogContent>
    </Dialog>
  );
}
