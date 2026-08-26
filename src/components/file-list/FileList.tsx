import { useEffect, useRef } from 'react';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { useQuery } from '@tanstack/react-query';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { commands } from '@/lib/bindings';
import { useTabState } from '@/store/tab-state';
import { TabFilesDirWalkerKeyHandler, TabFilesSelectionKeyHandler } from '@/lib/tab-files-key-handler';
import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { basename as tauri_basename, dirname as tauri_dirname } from '@tauri-apps/api/path';

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
        })
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
      const delay = performance.now() - e.timeStamp;
      if (100 < delay) {console.info("ignore keyboard event");return;} // 遅延が発生していたら無視

      const keyHandler = new TabFilesSelectionKeyHandler(visibleListRange.current - 1); // ヘッダーがあるので -1
      if (keyHandler.handleKey(e)) return;

      const keyHandlerDir = new TabFilesDirWalkerKeyHandler();
      keyHandlerDir.handleKey(e);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // スクロール位置調整
  useEffect(() => {
    virtuoso.current?.scrollIntoView({
      index: tab.files.focusIndex + 1, // ヘッダーがあるので +1
    });
  });

  console.debug(
    `<FileList> tab.path = ${tab.path}, useQuery.data = [${data?.length}], tab.list = ${tab.files.toDebugString()}`
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
                    isSelected={tab.files.focusIndex === index - 1}
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
