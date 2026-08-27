import React, { useEffect, useRef } from 'react';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { useQuery } from '@tanstack/react-query';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { commands } from '@/lib/bindings';
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

export default function FileList() {
  const virtuoso = useRef<VirtuosoHandle>(null);

  const updateCurrentTab = useTabState(state => state.updateCurrentTab);
  const tabs = useTabState(state => state.tabs);
  const currentTabIndex = useTabState(state => state.currentTabIndex);
  const tab = tabs[currentTabIndex];

  // データ取得
  const { data, isFetching } = useQuery({
    staleTime: 0,
    enabled: !tab.files.isInitialized(),
    queryKey: [tab.id, tab.path],
    queryFn: async () => {
      const ret = await commands.readDirEntries(tab.id, tab.path);
      console.info(`FileList: readDirEntries(${tab.path}) => `, ret);
      if (ret.status === 'error') {
        console.error(`FileList getDirEntries(${tab.id}, ${tab.path}) error: `, ret.error);
        updateCurrentTab(tab => {
          tab.files.setErrMsg(ret.error);
        });
        return;
      }
      return ret.data;
    },
  });
  useEffect(() => {
    if (data) {
      updateCurrentTab(tab => {
        tab.files.updateDirEntries(tab.path, data);
      });
    }
  }, [updateCurrentTab, data]);

  // 親ディレクトリに移動したときに、このディレクトリが選択されてほしいので、履歴に追加しておく
  useEffect(() => {
    const setHist = async () => {
      const parent = await tauri_dirname(tab.path);
      const base = await tauri_basename(tab.path);
      updateCurrentTab(tab => {
        tab.files.pushHistory(parent, base);
      });
    };
    setHist();
  }, [tab.path, updateCurrentTab]);

  // タイトルバー設定
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tab.path);
    };
    setTitle();
  }, [tab.path]);

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

      const keyHandler = new TabFilesSelectionKeyHandler(visibleListRange.current - 1); // ヘッダーがあるので -1
      if (keyHandler.handleKey(e)) return;

      const keyHandlerDir = new TabFilesDirWalkerKeyHandler();
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
      new TabFilesMouseHandler().handle(index, e);
    };
  }

  console.debug(
    `<FileList> tab.path = ${tab.path}, useQuery.data = [${data?.length}], tab.files = ${tab.files.toDebugString()}, scroll= ${scrollLevel}`
  );
  const dirEntries = tab.files.isInitialized() ? tab.files.getDirEntries() : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        {isFetching || dirEntries === undefined ? (
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
                    tabId={tab.id}
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
