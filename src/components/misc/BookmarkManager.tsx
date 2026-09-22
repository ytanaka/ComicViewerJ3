import { useUiVolatileStore } from "@/store/ui-volatile-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useTabStore } from "@/store/tab/store";
import { useCmdGetDirEntries } from "@/services/tab-dir-entry";
import { useBookmarkStore } from "@/store/bookmark-store";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";

export function BookmarkManager() {
  const showBookmarkManager = useUiVolatileStore(state => state.showBookmarkManager);
  const setVolatileField = useUiVolatileStore(state => state.setField);
  const tab = useTabStore(state => state.getCurrentTab()!);

  const { data: dirEntries } = useCmdGetDirEntries(tab.info);

  const list = useBookmarkStore(state => state.list);
  const focusIndex = useBookmarkStore(state => state.focusIndex);
  const setFocus = useBookmarkStore(state => state.setFocus);

  const handleAdd = useCallback(() => {
    useBookmarkStore.getState().addBookmark({
      dir: tab.info.path,
      item: dirEntries?.[tab.selection.focusIndex].name ?? "",
      mode: tab.fileViewMode,
    })
  }, [dirEntries, tab.fileViewMode, tab.info.path, tab.selection.focusIndex]);

  const handleRemove = useCallback(() => {
    useBookmarkStore.getState().removeBookmark(focusIndex);
  }, [focusIndex]);

  const handleMove = useCallback((i: number) => {
    useBookmarkStore.getState().moveBookmark(focusIndex, i);
  }, [focusIndex]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
    const NO_MOD = !C && !S && !A;
    const ALT_ONLY = !C && !S && A;

    function st() { return (useBookmarkStore.getState()) };
    const focusIndex = st().focusIndex;

    if (NO_MOD && e.key === "ArrowDown") {
      st().setFocus(focusIndex + 1);
      e.preventDefault();
      return true;
    } else if (NO_MOD && e.key === "ArrowUp") {
      st().setFocus(focusIndex - 1);
      e.preventDefault();
      return true;
    } else if (ALT_ONLY && e.key === 'a') {
      handleAdd();
      return true;
    } else if (ALT_ONLY && e.key === 'd') {
      handleRemove();
      return true;
    } else if (ALT_ONLY && e.key === 'ArrowDown') {
      handleMove(1);
      return true;
    } else if (ALT_ONLY && e.key === 'ArrowUp') {
      handleMove(-1);
      return true;
    }

    return false;
  }, [handleAdd, handleMove, handleRemove]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (handleKey(e)) {
        e.preventDefault();
      }
    }
    document.addEventListener("keydown", handleKeyDown, true); // true を指定しないと、矢印キーのイベントが来ない
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [focusIndex, handleKey, setFocus]);

  return (
    <Dialog open={showBookmarkManager} onOpenChange={b => setVolatileField('showBookmarkManager', b)}>
      <DialogContent className="w-[90vw]! max-w-[90vw]! h-[90vh] max-h-none flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="flex">
            <Button variant='secondary' onClick={handleAdd} title="ALT+A" >追加<span className="font-thin">(A)</span></Button>
            <div className="flex-1">{tab.info.path}/{dirEntries?.[tab.selection.focusIndex].name}</div>
          </div>

          <ul className="flex-1">
            {list.map((b, i) => {
              return (
                <li
                  key={i}
                  className={cn(focusIndex === i ? "border-2" : undefined)} >
                  {i} {b.dir}/{b.item}
                </li>
              )
            })}
          </ul>

          <div className="flex">
            <Button variant='secondary' onClick={() => handleMove(-1)} title='ALT+↑' >上へ移動<span className="font-thin">(↑)</span></Button>
            <Button variant='secondary' onClick={() => handleMove(1)} title='ALT+↓'>下へ移動<span className="font-thin">(↓)</span></Button>
            <Button variant='secondary' onClick={handleRemove} title='ALT+D' >削除<span className="font-thin">(D)</span></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

