import React, { ReactNode, useEffect, useState } from 'react';

import { path } from '@tauri-apps/api';

import { unixTime2str } from '@/lib/string-util';
import { useTabStore } from '@/store/tab/store';
import { tabFiles_handleMouseClick } from '@/lib/event-handler/tab-files-key-handler';
import { SearchResult } from './SearchResult';
import { DirEntry, FileInfo, TabInfo } from '@/lib/bindings-wrapper';
import { useFileInfo1Query } from '@/services/files';

import FileFolderIcon from '@iconify-react/fluent-emoji-flat/file-folder';
import WhiteMediumSquareIcon from '@iconify-react/fluent-emoji-flat/white-medium-square';
import PageFacingUpIcon from '@iconify-react/fluent-emoji-flat/page-facing-up';
import RedExclamationMarkIcon from '@iconify-react/fluent-emoji-flat/red-exclamation-mark';
import UpRightArrowIcon from '@iconify-react/fluent-emoji-flat/up-right-arrow';

function Icon({
  dirEntry,
  fileInfo,
  hasError,
}: {
  dirEntry: DirEntry;
  fileInfo: FileInfo | undefined;
  hasError: boolean;
}) {
  let icon: ReactNode;
  if (hasError) {
    icon = <RedExclamationMarkIcon></RedExclamationMarkIcon>
  } else if (fileInfo === undefined) {
    icon = <WhiteMediumSquareIcon></WhiteMediumSquareIcon>
  } else if (dirEntry.is_symlink && dirEntry.is_dir) {
    icon = (
      <div className="relative h-4">
        <FileFolderIcon></FileFolderIcon>
        <div className="absolute right-0 bottom-0 w-2.5">
          <UpRightArrowIcon></UpRightArrowIcon>
        </div>
      </div>
    );
  } else if (dirEntry.is_symlink) {
    icon = (
      <div className="relative h-4">
        <PageFacingUpIcon></PageFacingUpIcon>
        <div className="absolute right-0 bottom-0 w-2.5">
          <UpRightArrowIcon></UpRightArrowIcon>
        </div>
      </div>
    );
  } else if (dirEntry.is_dir) {
    icon = <FileFolderIcon></FileFolderIcon>
  } else {
    icon = <PageFacingUpIcon></PageFacingUpIcon>
  }
  return (
    <td style={{}} className="box-border w-[3%] pl-1 pr-1">
      {icon}
    </td>
  );
}
function Name({ dirEntry }: { dirEntry: DirEntry }) {
  return <td className={'box-border flex-1 shrink-0 min-w-0 truncate pl-1 pr-1'}>{dirEntry.name}</td>;
}
function FileExt({
  dirEntry,
  fileInfo,
  children,
}: {
  dirEntry: DirEntry;
  fileInfo: FileInfo | undefined;
  children: ReactNode;
}) {
  const [ext, setExt] = useState('');

  useEffect(() => {
    async function getExt() {
      setExt('');
      if (!fileInfo) return;
      const isDir = dirEntry.is_dir;
      if (!isDir) {
        const ext = await path.extname(dirEntry.name).catch(() => {
          return '';
        });
        if (ext !== '') setExt(ext);
      }
    }
    getExt();
  }, [dirEntry.is_dir, dirEntry.name, fileInfo]);

  return (
    <td style={{}} className={'box-border truncate pl-1 pr-1'}>
      {ext}
      {children}
    </td>
  );
}
function Size({ dirEntry, fileInfo }: { dirEntry: DirEntry; fileInfo: FileInfo | undefined }) {
  let size = undefined;
  if (!dirEntry.is_dir) {
    size = fileInfo?.metadata.Right?.size;
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
      {unixTime2str(fileInfo?.metadata.Right?.modified)}
    </td>
  );
}

export function FileListRow({
  tab: tabInfo,
  fileIndex,
  dirEntry,
  ...props
}: {
  tab: TabInfo;
  fileIndex: number;
  dirEntry: DirEntry;
} & React.HTMLAttributes<HTMLTableRowElement>) {
  const isSelected = useTabStore(state => state.getTab(tabInfo.id)?.selection.selectionIndexes.has(fileIndex));
  const isFocused = useTabStore(state => state.getTab(tabInfo.id)?.selection.focusIndex === fileIndex);
  const { data: fileInfo } = useFileInfo1Query(tabInfo, dirEntry.file_id);
  const errorMsg = fileInfo?.metadata.Left;

  // マウスクリック
  function handleClick(e: React.MouseEvent) {
    tabFiles_handleMouseClick(e, tabInfo, fileIndex);
  }

  if (fileIndex === 0) console.debug(`<FileListRow>[${fileIndex}] tabId:${tabInfo.id}`);

  let bg = fileIndex % 2 == 0 ? '' : 'bg-gray-200 dark:bg-gray-900';
  if (isSelected) bg = 'dark:bg-blue-700 bg-blue-300 dark:text-white text-black';
  const border = isFocused && 'outline-dashed outline dark:outline-white outline-black';
  return (
    <tr title={errorMsg} className={`${bg} ${border}`} onClick={handleClick} {...props}>
      <Icon dirEntry={dirEntry} fileInfo={fileInfo} hasError={!!errorMsg} />
      <Name dirEntry={dirEntry} />
      <FileExt dirEntry={dirEntry} fileInfo={fileInfo}>
        {isFocused && <SearchResult tabInfo={tabInfo} />}
      </FileExt>
      <Size dirEntry={dirEntry} fileInfo={fileInfo} />
      <Modified fileInfo={fileInfo} />
    </tr>
  );
}
