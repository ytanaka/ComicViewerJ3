import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '@/lib/utils';

import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { useTabStore } from '@/store/tab/store';
import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { Bookmark, useBookmarkStore } from '@/store/bookmark-store';
import { bookmark_eventhandler, bookmarkCommands } from './event-handler';
import { ChevronsRight, Grid2X2, Rows3, Square, SquareX } from 'lucide-react';
import { FileViewMode } from '@/store/tab/types';

export function BookmarkManager() {
  const showBookmarkManager = useUiVolatileStore(state => state.showBookmarkManager);
  const setVolatileField = useUiVolatileStore(state => state.setField);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);


  const list = useBookmarkStore(state => state.list);
  const focusIndex = useBookmarkStore(state => state.focusIndex);

  // ブックマークのファイル名が有効か
  const [enableName, setEnableName] = useState(true);
  function handleNameToggle() {
    setEnableName(state => !state);
  }
  useEffect(() => {
    if (!showBookmarkManager) return;
    Promise.resolve().then(() => {
      setEnableName(true);
    });
  }, [showBookmarkManager]); // ダイアログオープン時に毎回呼ばれる

  const mkNewBk = useCallback(() => {
    const tab = useTabStore.getState().getCurrentTab();
    if (!tab) {
      return {
        dir: "",
        name: '',
        mode: FileViewMode.List,
        thumbnailSize: 128,
      };
    }
    const dirEntries = getQueryData_getDirEntries(tab.info.id);
    return {
      dir: tab.info.path,
      name: enableName ? (dirEntries?.[tab.selection.focusIndex].name ?? '') : '',
      mode: tab.fileViewMode,
      thumbnailSize: tab.thumbnailSize,
    };
  }, [enableName]);

  useEffect(() => {
    listRef.current?.focus();
  }, []);

  useEffect(() => {
    itemRefs.current[focusIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusIndex]);

  useEffect(() => {
    if (!showBookmarkManager) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (bookmark_eventhandler(e, mkNewBk())) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }
    document.addEventListener('keydown', handleKeyDown, true); // true を指定しないと、矢印キーのイベントが来ない
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [mkNewBk, showBookmarkManager]); // ダイアログクローズ時にイベントハンドラを解除したいので showBookmarkManager を指定する

  return (
    <Dialog open={showBookmarkManager} onOpenChange={b => setVolatileField('showBookmarkManager', b)}>
      <DialogContent className="w-[90vw]! max-w-[90vw]! h-[90vh] max-h-none flex flex-col select-none">
        <DialogHeader>
          <DialogTitle>ブックマーク</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex m-2 justify-center items-center">
            <MyButton name="追加" keyChar="A" onClick={() => bookmarkCommands.add(mkNewBk())} />
            <div className="flex flex-1 border flex-row">
              <Item bk={mkNewBk()} />
              <Button size="xs" tabIndex={-1} variant="ghost" onClick={handleNameToggle}>
                {enableName ? <SquareX /> : <Square />}{' '}
              </Button>
            </div>
          </div>

          <ul className="flex-1 border-2 min-h-0 overflow-auto" ref={listRef} tabIndex={0}>
            {list.map((b, i) => {
              return (
                <li
                  key={i}
                  ref={el => {
                    itemRefs.current[i] = el;
                  }}
                  className={cn(
                    focusIndex === i ? 'dark:bg-blue-700 bg-blue-300 dark:text-white text-black' : undefined
                  )}
                  onClick={() => useBookmarkStore.getState().setFocus(i)}
                >
                  <Item bk={b} />
                </li>
              );
            })}
          </ul>

          <div className="flex m-2">
            <MyButton name="上へ移動" keyChar="↑" onClick={() => bookmarkCommands.moveFocusUpDown(-1)} />
            <MyButton name="下へ移動" keyChar="↓" onClick={() => bookmarkCommands.moveFocusUpDown(1)} />
            <MyButton name="削除" keyChar="D" onClick={bookmarkCommands.remove} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MyButton({ name, keyChar, onClick }: { name: string; keyChar: string; onClick: () => void }) {
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
      {name}
      <span className="font-thin">({keyChar})</span>
    </Button>
  );
}

function Item({ bk }: { bk: Bookmark }) {
  return (
    <div className="flex">
      {bk.mode === FileViewMode.List ? <Rows3 className="opacity-50" /> : <Grid2X2 className="opacity-50" />}
      <span className="ml-2 mr-2">{bk.dir}</span>
      <ChevronsRight className="opacity-50" />
      <span className="ml-2">{bk.name}</span>
    </div>
  );
}
