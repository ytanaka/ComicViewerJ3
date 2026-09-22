import { useEffect } from 'react';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '@/lib/utils';

import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { useTabStore } from '@/store/tab/store';
import { useCmdGetDirEntries } from '@/services/tab-dir-entry';
import { useBookmarkStore } from '@/store/bookmark-store';
import { bookmark_eventhandler, bookmarkCommands } from './event-handler';

export function BookmarkManager() {
  const showBookmarkManager = useUiVolatileStore(state => state.showBookmarkManager);
  const setVolatileField = useUiVolatileStore(state => state.setField);
  const tab = useTabStore(state => state.getCurrentTab()!);

  const { data: dirEntries } = useCmdGetDirEntries(tab.info);

  const list = useBookmarkStore(state => state.list);
  const focusIndex = useBookmarkStore(state => state.focusIndex);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (bookmark_eventhandler(e)) {
        e.preventDefault();
      }
    }
    document.addEventListener('keydown', handleKeyDown, true); // true を指定しないと、矢印キーのイベントが来ない
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <Dialog open={showBookmarkManager} onOpenChange={b => setVolatileField('showBookmarkManager', b)}>
      <DialogContent className="w-[90vw]! max-w-[90vw]! h-[90vh] max-h-none flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="flex">
            <Button variant="secondary" onClick={bookmarkCommands.add} title="ALT+A">
              追加<span className="font-thin">(A)</span>
            </Button>
            <div className="flex-1">
              {tab.info.path}/{dirEntries?.[tab.selection.focusIndex].name}
            </div>
          </div>

          <ul className="flex-1">
            {list.map((b, i) => {
              return (
                <li key={i} className={cn(focusIndex === i ? 'border-2' : undefined)}>
                  {i} {b.dir}/{b.item}
                </li>
              );
            })}
          </ul>

          <div className="flex">
            <Button variant="secondary" onClick={() => bookmarkCommands.moveFocusUpDown(-1)} title="ALT+↑">
              上へ移動<span className="font-thin">(↑)</span>
            </Button>
            <Button variant="secondary" onClick={() => bookmarkCommands.moveFocusUpDown(1)} title="ALT+↓">
              下へ移動<span className="font-thin">(↓)</span>
            </Button>
            <Button variant="secondary" onClick={bookmarkCommands.remove} title="ALT+D">
              削除<span className="font-thin">(D)</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
