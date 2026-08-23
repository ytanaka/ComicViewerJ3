import { useEffect, useRef, useState } from 'react';

import { path } from '@tauri-apps/api';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useQuery } from '@tanstack/react-query';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { toast } from 'sonner';

import { commands, DirEntry, FileInfo } from '@/lib/bindings';
import { unixTime2str } from '@/lib/date-time-util';
import { useTabState } from '@/store/tab-state';
import { ListFilesKeyHandler } from '@/lib/list-files-key-handler';

function Icon({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  let icon: string;
  if (fileInfo === undefined || fileInfo.metadata === null) {
    icon = ' ';
  } else if (fileInfo?.metadata.is_dir) {
    icon = '📁';
  } else {
    icon = '📄';
  }
  return <div className="w-[2ch] ml-1 mr-1">{icon}</div>;
}
function Name({ dirEntry }: { dirEntry: DirEntry }) {
  return <div className="flex-1 ml-1 mr-1">{dirEntry.name}</div>;
}
function FileExt({ dirEntry, fileInfo }: { dirEntry: DirEntry; fileInfo: FileInfo | undefined }) {
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

  return <div className="w-[5ch] ml-1 mr-1">{ext}</div>;
}
function Size({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  let size = undefined;
  if (!fileInfo?.metadata?.is_dir) {
    size = fileInfo?.metadata?.size;
  }
  return <div className="w-[8ch] ml-1 mr-1 text-right">{size}</div>;
}
function Modified({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  return <div className="ml-1 mr-1">{unixTime2str(fileInfo?.metadata?.modified)}</div>;
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
  const { data } = useQuery({
    staleTime: 0,
    queryKey: [dirEntry.id],
    queryFn: async () => {
      const ret = await commands.getFileInfo(tabId, dirEntry.id.toString());
      if (ret.status === 'error') {
        console.error('getFileInfo(', dirEntry.name, ') => ', ret.error);
        toast.error(`ファイル情報取得に失敗(${dirEntry.name})`);
        throw Error(ret.error);
      }
      console.log('getFileInfo(', dirEntry.name, ') => ', ret.data);
      return ret.data;
    },
  });

  return (
    <div
      className={`${index % 2 == 0 ? '' : 'bg-gray-200 dark:bg-gray-900'} flex pl-1.5 pr-1.5 h-6`}
      style={{
        background: isSelected ? '#0078d4' : '',
      }}
    >
      <Icon fileInfo={data} />
      <Name dirEntry={dirEntry} />
      <FileExt dirEntry={dirEntry} fileInfo={data} />
      <Size fileInfo={data} />
      <Modified fileInfo={data} />
    </div>
  );
}

export default function FileList({ className = '' }: { className: string }) {
  const virtuoso = useRef<VirtuosoHandle>(null);

  const tabs = useTabState(state => state.tabs);
  const updateTab = useTabState(state => state.updateTab);
  const currentTabIndex = useTabState(state => state.currentTabIndex);
  const tab = tabs[currentTabIndex];

  const { data, isFetching } = useQuery({
    staleTime: 0,
    enabled: !tab.list.isInitialized(),
    queryKey: [tab.id, tab.path],
    queryFn: async () => {
      const ret = await commands.readDirEntries(tab.id, tab.path);
      console.log('readDirEntries() => ', ret);
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
      tab.list.updateDirEntries(tab.path, data);
      updateTab(currentTabIndex, tab);
    }
  }, [updateTab, data, currentTabIndex, tab])

  // タイトルバー設定
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tab.path);
      toast.info(tab.path);
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
      const keyHandler = new ListFilesKeyHandler(tab.list, visibleListRange.current);
      if (keyHandler.handleKey(e)) {
        updateTab(currentTabIndex, tab);
        virtuoso.current?.scrollIntoView({
          index: tab.list.focusIndex,
          behavior: 'auto',
        });
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  })

  return (
    <div className={`${className} flex flex-col`}>
      <div className="flex-1">
        {isFetching || data === undefined ? (
          <div />
        ) : (
          <Virtuoso
            ref={virtuoso}
            totalCount={data.length}
            rangeChanged={handleRangeChanged}
            itemContent={index => {
              return (
                <FileListRow
                  index={index}
                  tabId={tab.id}
                  dirEntry={data[index]}
                  isSelected={tab.list.focusIndex === index}
                />);
            }}
          />
        )}
      </div>
    </div>
  );
}
