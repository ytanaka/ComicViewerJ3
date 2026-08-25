import { useEffect, useRef } from 'react';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { useQuery } from '@tanstack/react-query';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { toast } from 'sonner';

import { commands } from '@/lib/bindings';
import { useTabState } from '@/store/tab-state';
import { TabFilesDirWalkerKeyHandler, TabFilesSelectionKeyHandler } from '@/lib/tab-files-key-handler';
import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';

export default function FileList() {
  const virtuoso = useRef<VirtuosoHandle>(null);

  const updateCurrentTab = useTabState(state => state.updateCurrentTab);
  const tabs = useTabState(state => state.tabs);
  const currentTabIndex = useTabState(state => state.currentTabIndex);
  const tab = tabs[currentTabIndex];

  const { data, isFetching } = useQuery({
    staleTime: 0,
    enabled: !tab.files.isInitialized(),
    queryKey: [tab.id, tab.path],
    queryFn: async () => {
      const ret = await commands.readDirEntries(tab.id, tab.path);
      console.info(`FileList: readDirEntries(${tab.path}) => `, ret);
      if (ret.status === 'error') {
        console.error(`FileList getDirEntries(${tab.id}, ${tab.path}) error: `, ret.error);
        toast.error(`ディレクトリ情報が取得できません`);
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

  // タイトルバー設定
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tab.path);
    };
    setTitle();
  }, [tab.path]);

  // スクロール位置
  const visibleListRange = useRef(1);
  const handleRangeChanged = (range: ListRange) => {
    visibleListRange.current = Math.max(1, range.endIndex - range.startIndex);
  };

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keyHandler = new TabFilesSelectionKeyHandler(visibleListRange.current - 1); // ヘッダーがあるので -1
      if (keyHandler.handleKey(e)) {
        virtuoso.current?.scrollIntoView({
          index: tab.files.focusIndex + 1, // ヘッダーがあるので +1
          behavior: 'auto',
        });
      }

      const keyHandlerDir = new TabFilesDirWalkerKeyHandler();
      keyHandlerDir.handleKey(e);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
