import React, { ReactNode, useEffect, useState } from 'react';

import { path } from '@tauri-apps/api';

import { DirEntry, FileInfo } from '@/lib/bindings';
import { unixTime2str } from '@/lib/string-util';
import { useTabStore } from '@/store/tab/store';
import { TabInfo } from '@/store/tab/types';
import { logic } from '@/lib/bindings-helper';
import { tabFiles_handleMouseClick } from '@/lib/event-handler/tab-files-key-handler';
import { SearchResult } from './SearchResult';

function Icon({ fileInfo, hasError }: { fileInfo: FileInfo | undefined; hasError: boolean }) {
  let icon: string;
  if (hasError) {
    icon = '❌';
  } else if (fileInfo === undefined) {
    icon = ' ';
  } else if (fileInfo?.is_dir) {
    icon = '📁';
  } else {
    icon = '📄';
  }
  return (
    <td style={{}} className="box-border w-[3%] pl-1 pr-1">
      {icon}
    </td>
  );
}
function Name({ dirEntry, children }: { dirEntry: DirEntry, children: ReactNode }) {
  return <td className={'box-border flex-1 shrink-0 min-w-0 truncate pl-1 pr-1'}>{dirEntry.name}{children}</td>;
}
function FileExt({ dirEntry, fileInfo }: { dirEntry: DirEntry; fileInfo: FileInfo | undefined }) {
  const [ext, setExt] = useState('');

  useEffect(() => {
    async function getExt() {
      setExt('');
      if (!fileInfo) return;
      const isDir = fileInfo.is_dir;
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
    <td style={{}} className={'box-border truncate pl-1 pr-1'}>
      {ext}
    </td>
  );
}
function Size({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  let size = undefined;
  if (!fileInfo?.is_dir) {
    size = fileInfo?.metadata.Left?.size;
  }
  return (
    <td style={{}} className={'box-border truncate pl-1 pr-1 text-right'}>
      {size?.toLocaleString()}
    </td>
  );
}
function Modified({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  return (
    <td style={{}} className={'box-border truncate pl-1 pr-1'}>
      {unixTime2str(fileInfo?.metadata.Left?.modified)}
    </td>
  );
}

export function FileListRow(
  { tab, fileIndex, dirEntry, ...props }: {
    tab: TabInfo;
    fileIndex: number;
    dirEntry: DirEntry;
  } & React.HTMLAttributes<HTMLTableRowElement>) {
  const fileInfo = useTabStore(state => state.getFileInfo(tab.id, fileIndex));
  const fileInfoErrorMsg = useTabStore(state => state.getFileInfoErrorMsg(tab.id, fileIndex));
  const isSelected = useTabStore(state => state.getSelection(tab.id).selectionIndexes.has(fileIndex));
  const isFocused = useTabStore(state => state.getSelection(tab.id).focusIndex === fileIndex);
  let errorMsg: string | undefined = fileInfoErrorMsg;
  if (!errorMsg) errorMsg = fileInfo?.metadata.Right;

  useEffect(() => {
    const read = async () => {
      if (!errorMsg && !fileInfo) {
        await logic.readFileInfo(tab.id, fileIndex);
      }
    };
    read();
  }, [fileIndex, tab.id, errorMsg, fileInfo]);

  // マウスクリック
  function handleClick(e: React.MouseEvent) {
    tabFiles_handleMouseClick(e, tab, fileIndex);
  }

  if (fileIndex === 0) console.debug(`<FileListRow> tabId:${tab.id} file:${dirEntry.name}`);

  let bg = fileIndex % 2 == 0 ? '' : 'bg-gray-200 dark:bg-gray-900';
  if (isSelected) bg = 'dark:bg-blue-700 bg-blue-300 dark:text-white text-black';
  const border = isFocused && 'border-dashed border dark:border-white border-black';
  return (
    <tr title={errorMsg} className={`${bg} ${border}`} onClick={handleClick} {...props}>
      <Icon fileInfo={fileInfo} hasError={!!errorMsg} />
      <Name dirEntry={dirEntry} >{isFocused && <SearchResult tab={tab} />}</Name>
      <FileExt dirEntry={dirEntry} fileInfo={fileInfo} />
      <Size fileInfo={fileInfo} />
      <Modified fileInfo={fileInfo} />
    </tr>
  );
}
