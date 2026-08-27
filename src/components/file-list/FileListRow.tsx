import React, { useEffect, useState } from 'react';

import { path } from '@tauri-apps/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import { commands, DirEntry, FileInfo } from '@/lib/bindings';
import { useTabState } from '@/store/tab-state';
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

  useEffect(() => {
    async function getExt() {
      setExt('');
      if (!fileInfo || !fileInfo.metadata) return;
      const isDir = fileInfo.metadata.is_dir;
      if (!isDir) {
        const ext = await path.extname(dirEntry.name).catch(() => {
          return '';
        });
        if (ext !== '') setExt(ext);
      }
    }
    getExt();
  }, [dirEntry.name, fileInfo]);

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
      {size?.toLocaleString()}
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

export function FileListRow({
  index,
  tabId,
  dirEntry,
  isSelected,
  isFocused,
  onClick,
}: {
  index: number;
  tabId: number;
  dirEntry: DirEntry;
  isSelected: boolean;
  isFocused: boolean;
  onClick: React.MouseEventHandler;
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
  const bg = index % 2 == 0 ? '' : 'bg-gray-200 dark:bg-gray-900';
  const border = isFocused && 'border-dashed border dark:border-white border-black'
  const baseComponent = (
    <div
      className={`${bg} ${border} flex w-full pl-1.5 pr-1.5 h-6`}
      style={{
        background: isSelected ? '#0078d4' : '',
      }}
      onClick={onClick}
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
