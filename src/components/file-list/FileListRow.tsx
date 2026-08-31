import React, { useEffect, useState } from 'react';

import { path } from '@tauri-apps/api';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import { DirEntry, FileInfo } from '@/lib/bindings';
import { FileListHeaderN, useUiStore } from '@/store/ui-store';
import { unixTime2str } from '@/lib/string-util';
import { useTabStore } from '@/store/tab/store';
import { TabInfo } from '@/store/tab/types';
import { logic } from '@/lib/bindings-helper';
import { tabFiles_handleMouseClick } from '@/lib/event-handler/tab-files-key-handler';
import { SearchResult } from './SearchResult';

function useHeaderSize(n: FileListHeaderN): number {
  const sizes = useUiStore(state => state.fileListHeaderSizes);
  return sizes[n];
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

export function FileListRow({ tab, fileIndex, dirEntry }: { tab: TabInfo; fileIndex: number; dirEntry: DirEntry }) {
  const wrapper = useTabStore(state => state.getFileInfoWrapper(tab.id, fileIndex));
  const isSelected = useTabStore(state => state.getSelection(tab.id).selectionIndexes.has(fileIndex));
  const isFocused = useTabStore(state => state.getSelection(tab.id).focusIndex === fileIndex);

  useEffect(() => {
    const read = async () => {
      if (!wrapper.errorMsg && !wrapper.fileInfo) {
        await logic.readFileInfo(tab.id, fileIndex);
      }
    };
    read();
  }, [fileIndex, tab.id, wrapper.errorMsg, wrapper.fileInfo]);

  // マウスクリック
  function handleClick(e: React.MouseEvent) {
    tabFiles_handleMouseClick(e, tab, fileIndex);
  }

  if (fileIndex === 0) console.debug(`<FileListRow> tabId:${tab.id} file:${dirEntry.name}`);

  const fileInfo = wrapper.fileInfo;
  let bg = fileIndex % 2 == 0 ? '' : 'bg-gray-200 dark:bg-gray-900';
  if (isSelected) bg = 'dark:bg-blue-700 bg-blue-300 dark:text-white text-black';
  const border = isFocused && 'border-dashed border dark:border-white border-black';
  const baseComponent = (
    <div
      className={`${bg} ${border} flex w-full pl-1.5 pr-1.5 h-6`}
      style={{
        // background: isSelected ? '#0078d4' : '',
      }}
      onClick={handleClick}
    >
      {isFocused && <SearchResult tab={tab} />}
      <Icon fileInfo={fileInfo} errorMsg={wrapper.errorMsg} />
      <Name dirEntry={dirEntry} />
      <FileExt dirEntry={dirEntry} fileInfo={fileInfo} />
      <Size fileInfo={fileInfo} />
      <Modified fileInfo={fileInfo} />
    </div>
  );

  if (wrapper.errorMsg) {
    return (
      <Tooltip>
        <TooltipTrigger render={baseComponent} />
        <TooltipContent>
          <p>{wrapper.errorMsg}</p>
        </TooltipContent>
      </Tooltip>
    );
  } else {
    return baseComponent;
  }
}
