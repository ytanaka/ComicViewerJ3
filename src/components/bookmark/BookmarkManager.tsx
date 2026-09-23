import { useEffect, useRef } from 'react';

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
  const listRef = useRef<HTMLUListElement>(null);

  const { data: dirEntries } = useCmdGetDirEntries(tab.info);

  const list = useBookmarkStore(state => state.list);
  const focusIndex = useBookmarkStore(state => state.focusIndex);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.focus();
  });

  useEffect(() => {
    if (!showBookmarkManager) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (bookmark_eventhandler(e)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true); // true を指定しないと、矢印キーのイベントが来ない
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [showBookmarkManager]); // ダイアログクローズ時にイベントハンドラを解除したいので

  return (
    <Dialog open={showBookmarkManager} onOpenChange={b => setVolatileField('showBookmarkManager', b)}>
      <DialogContent className="w-[90vw]! max-w-[90vw]! h-[90vh] max-h-none flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          <div className="flex m-2">
            <MyButton name="追加" keyChar='A' onClick={bookmarkCommands.add} />
            <div className="flex-1">
              {tab.info.path}/{dirEntries?.[tab.selection.focusIndex].name}
            </div>
          </div>

          <ul className="flex-1 border-2" ref={listRef} tabIndex={0} >
            {list.map((b, i) => {
              return (
                <li key={i} className={cn(focusIndex === i ? 'border-2' : undefined)}>
                  {i} {b.dir}/{b.item}
                </li>
              );
            })}
          </ul>

          <div className="flex m-2">
            <MyButton name="上へ移動" keyChar='↑' onClick={() => bookmarkCommands.moveFocusUpDown(-1)} />
            <MyButton name="下へ移動" keyChar='↓' onClick={() => bookmarkCommands.moveFocusUpDown(1)} />
            <MyButton name="削除" keyChar='D' onClick={bookmarkCommands.remove} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MyButton({ name, keyChar, onClick }: { name: string, keyChar: string, onClick: () => void }) {
  return (
    <Button
      className="mr-2"
      variant="secondary"
      tabIndex={-1}
      onClick={e => {
        onClick();
        e.preventDefault();
      }}
      title={`Alt+${keyChar}`}
    >
      {name}<span className="font-thin">({keyChar})</span>
    </Button>
  );
}
