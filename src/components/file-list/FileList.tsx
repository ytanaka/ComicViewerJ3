import React, { useEffect, useRef } from 'react';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { useTabState } from '@/store/tab-state';
import {
  TabFilesDirWalkerKeyHandler,
  TabFilesMouseHandler,
  TabFilesSelectionKeyHandler,
} from '@/lib/tab-files-key-handler';
import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { basename as tauri_basename, dirname as tauri_dirname } from '@tauri-apps/api/path';
import { ScrollLevel, useScrollToFocusState } from '@/store/scroll-to-focus-state';
import { useTabFilesOp } from '@/store/tab-files';
import { useTabInfoOp } from '@/store/tab-info';
import { mkFileFocusHistoryOp } from '@/store/file-focus-history';

export default function FileList() {
  const virtuoso = useRef<VirtuosoHandle>(null);

  const currentTabIndex = useTabState(state => state.currentTabIndex);
  const tab = useTabState(state => state.getCurrentTab());

  const tabInfoOp = useTabInfoOp(tab);
  const tabFilesOp = useTabFilesOp(tab);

  console.debug(`<FileList> tab[${currentTabIndex}](id:${tab.id}) = ${tabFilesOp.toDebugString()}`);

  // データ取得
  useEffect(() => {
    const read = async () => {
      if (!tabFilesOp.isInitialized()) {
        tabInfoOp.readDirEntries();
      }
    }
    read();
  }, [tabFilesOp, tabInfoOp])

  // 親ディレクトリに移動したときに、このディレクトリが選択されてほしいので、履歴に追加しておく
  useEffect(() => {
    const setHist = async () => {
      const hist = mkFileFocusHistoryOp();
      const parent = await tauri_dirname(tabFilesOp.getPath());
      if (!hist.find(parent)) {
        const base = await tauri_basename(tabFilesOp.getPath());
        tabFilesOp.pushHistory(parent, base);
      }
    };
    setHist();
  }, [tabFilesOp]);

  // タイトルバー設定
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tabFilesOp.getPath());
    };
    setTitle();
  }, [tabFilesOp]);

  // スクロール位置検知
  const visibleListRange = useRef(1);
  const handleRangeChanged = (range: ListRange) => {
    visibleListRange.current = Math.max(1, range.endIndex - range.startIndex);
  };

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      if (100 < delay) {
        console.info('ignore keyboard event');
        return;
      }

      // console.debug('key ', e);

      const keyHandler = new TabFilesSelectionKeyHandler(tab, visibleListRange.current - 1); // ヘッダーがあるので -1
      if (keyHandler.handleKey(e)) return;

      const keyHandlerDir = new TabFilesDirWalkerKeyHandler(tab);
      if (keyHandlerDir.handleKey(e)) return;
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // スクロール位置調整
  const scrollLevel = useScrollToFocusState(state => state.scrollLevel);
  const setScroll = useScrollToFocusState(state => state.setScroll);
  useEffect(() => {
    if (scrollLevel !== ScrollLevel.No) {
      function scr() {
        virtuoso.current?.scrollIntoView({
          index: tab.files.focusIndex + 1, // ヘッダーがあるので +1
        });
      }

      scr();
      if (scrollLevel === ScrollLevel.Lazy) {
        // 親ディレクトリに移動したときにうまくスクロールしないので遅延させる
        setTimeout(() => scr(), 100);
      }
      setScroll(ScrollLevel.No);
    }
  }, [scrollLevel, setScroll, tab.files.focusIndex]);

  // マウスクリック
  function createMouseEventHandler(index: number) {
    return function (e: React.MouseEvent) {
      new TabFilesMouseHandler(tab).handle(index, e);
    };
  }

  const dirEntries = tabFilesOp.isInitialized() ? tabFilesOp.getDirEntries() : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        {dirEntries === undefined ? (
          <div>更新中</div>
        ) : (
          <Virtuoso
            ref={virtuoso}
            totalCount={dirEntries.length + 1}
            topItemCount={1}
            rangeChanged={handleRangeChanged}
            itemContent={index => {
              if (index === 0) {
                return <FileListHeader />;
              } else {
                return (
                  <FileListRow
                    index={index - 1}
                    dirEntry={dirEntries[index - 1]}
                    isSelected={tab.files.selectionIndexes.has(index - 1)}
                    isFocused={tab.files.focusIndex === index - 1}
                    onClick={createMouseEventHandler(index - 1)}
                  />
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
