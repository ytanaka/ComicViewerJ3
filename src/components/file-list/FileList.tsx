import { useEffect, useRef, useState } from 'react';

import { path } from '@tauri-apps/api';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useQuery } from '@tanstack/react-query';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { toast } from 'sonner';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import { commands, DirEntry, FileInfo } from '@/lib/bindings';
import { useTabState } from '@/store/tab-state';
import { TabFilesDirWalkerKeyHandler, TabFilesSelectionKeyHandler } from '@/lib/tab-files-key-handler';
import { FileListHeader } from './FileListHeader';
import { FileListHeaderN, useUiState } from '@/store/ui-state';
import { unixTime2str } from '@/lib/string-util';

function useHeaderSize(n: FileListHeaderN): number {
  return useUiState(state => state.fileListHeaderSizes)[n];
}

function Icon({ fileInfo, errorMsg }: { fileInfo: FileInfo | undefined; errorMsg: string | undefined }) {
  const width = useHeaderSize(FileListHeaderN.Icon);
  let icon: string;
  if (errorMsg) {
    icon = '❌';
  } else if (fileInfo === undefined || fileInfo.metadata === null) {
    icon = ' ';
  } else if (fileInfo?.metadata.is_dir) {
    icon = '📁';
  } else {
    icon = '📄';
  }
  return (
    <div style={{ width: `${width}px` }} className="box-border w-[3%] pl-1 pr-1">
      {icon}
    </div>
  );
}
function Name({ dirEntry }: { dirEntry: DirEntry }) {
  return <div className={'box-border flex-1 shrink-0 min-w-0 truncate pl-1 pr-1'}>{dirEntry.name}</div>;
}
function FileExt({ dirEntry, fileInfo }: { dirEntry: DirEntry; fileInfo: FileInfo | undefined }) {
  const width = useHeaderSize(FileListHeaderN.Ext);
  const [ext, setExt] = useState('');
  const isFile = !fileInfo?.metadata?.is_dir;

  useEffect(() => {
    async function getExt() {
      if (isFile) {
        const ext = await path.extname(dirEntry.name).catch(() => {
          return '';
        });
        if (ext !== '') setExt(ext);
      }
    }
    getExt();
  }, [dirEntry.name, isFile]);

  return (
    <div style={{ width: `${width}px` }} className={'box-border truncate pl-1 pr-1'}>
      {ext}
    </div>
  );
}
function Size({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  const width = useHeaderSize(FileListHeaderN.Size);
  let size = undefined;
  if (!fileInfo?.metadata?.is_dir) {
    size = fileInfo?.metadata?.size;
  }
  return (
    <div style={{ width: `${width}px` }} className={'box-border truncate pl-1 pr-1 text-right'}>
      {size}
    </div>
  );
}
function Modified({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  const width = useHeaderSize(FileListHeaderN.Date);
  return (
    <div style={{ width: `${width}px` }} className={'box-border truncate pl-1 pr-1'}>
      {unixTime2str(fileInfo?.metadata?.modified)}
    </div>
  );
}

function FileListRow({
  index,
  tabId,
  dirEntry,
  isSelected,
}: {
  index: number;
  tabId: number;
  dirEntry: DirEntry;
  isSelected: boolean;
}) {
  const updateCurrentTab = useTabState(state => state.updateCurrentTab);
  const currentTabIndex = useTabState(state => state.currentTabIndex);
  const tabs = useTabState(state => state.tabs);
  const tab = tabs[currentTabIndex];

  const { data } = useQuery({
    staleTime: 0,
    queryKey: [tabId, dirEntry.id],
    enabled: tab.files.getFileInfo(index) === undefined && tab.files.getFileError(index) === undefined,
    queryFn: async () => {
      const ret = await commands.getFileInfo(tabId, dirEntry.id.toString());
      if (ret.status === 'error') {
        console.warn('FileList: getFileInfo(', dirEntry.name, ') => ', ret.error);
        toast.error(`ファイル情報取得に失敗(${dirEntry.name})`);
        updateCurrentTab(tab => {
          tab.files.setFileError(index, ret.error);
        });
        throw Error(ret.error);
      }
      // console.debug('FileList: getFileInfo(', dirEntry.name, ') => ', ret.data);
      return ret.data;
    },
  });
  useEffect(() => {
    if (!data) return;
    updateCurrentTab(tab => {
      tab.files.setFileInfo(index, data);
    });
  }, [data, index, updateCurrentTab]);

  const fileInfo = tab.files.getFileInfo(index);
  const baseComponent = (
    <div
      className={`${index % 2 == 0 ? '' : 'bg-gray-200 dark:bg-gray-900'} flex w-full pl-1.5 pr-1.5 h-6`}
      style={{
        background: isSelected ? '#0078d4' : '',
      }}
    >
      <Icon fileInfo={fileInfo} errorMsg={tab.files.getFileError(index)} />
      <Name dirEntry={dirEntry} />
      <FileExt dirEntry={dirEntry} fileInfo={fileInfo} />
      <Size fileInfo={fileInfo} />
      <Modified fileInfo={fileInfo} />
    </div>
  );
  const errorMsg = tab.files.getFileError(index);
  if (errorMsg) {
    return (
      <Tooltip>
        <TooltipTrigger render={baseComponent} />
        <TooltipContent>
          <p>{errorMsg}</p>
        </TooltipContent>
      </Tooltip>
    );
  } else {
    return baseComponent;
  }
}

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
    <div className={'flex-1 flex flex-col'}>
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
