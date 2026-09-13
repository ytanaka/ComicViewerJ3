import { DirEntry, TabInfo } from '@/lib/bindings-wrapper';
import { useThumbnailPath } from '@/services/tab-thumbnail';
import { convertFileSrc } from '@tauri-apps/api/core';
import { THUMBNAIL_CELL_CLASSNAME } from './Thumbnails';
import { cn } from '@/lib/utils';
import { useTabStore } from '@/store/tab/store';
import { useFileInfo1Query } from '@/services/tab-file-info';
import { tabFiles_handleMouseClick } from '@/lib/event-handler/tab-files-key-handler';
import React from 'react';

const THUMBNAIL_SIZE = 128;

export function ThumbnailCell({ tab, fileIndex, dirEntry }: { tab: TabInfo; fileIndex: number; dirEntry: DirEntry }) {
  const isSelected = useTabStore(state => state.getTab(tab.id)?.selection.selectionIndexes.has(fileIndex));
  const isFocused = useTabStore(state => state.getTab(tab.id)?.selection.focusIndex === fileIndex);
  const { data: fileInfo } = useFileInfo1Query(tab, dirEntry.file_id);
  const errorMsg = fileInfo?.metadata.Left;

  // サムネイル画像ファイル作成
  const { data: thumbPath } = useThumbnailPath(tab.id, dirEntry.file_id, THUMBNAIL_SIZE);

  // マウスクリック
  function handleClick(e: React.MouseEvent) {
    tabFiles_handleMouseClick(e, tab, fileIndex);
  }

  if (fileIndex === 0) console.debug(`<ThumbnailCell>[${fileIndex}] tabId:${tab.id}`);

  let bg = '';
  if (isSelected) bg = 'dark:bg-blue-700 bg-blue-300 dark:text-white text-black';
  const border = isFocused && 'outline-dashed outline dark:outline-white outline-black';

  return (
    <div
      className={cn(THUMBNAIL_CELL_CLASSNAME, border, bg)}
      onClick={handleClick}
      title={`${dirEntry.name}${errorMsg ?? <br />}${errorMsg}`}
    >
      <figure>
        <img
          src={!thumbPath ? undefined : convertFileSrc(thumbPath)}
          loading="lazy"
          style={{
            display: 'block',
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            objectFit: 'none',
          }}
        />
        <figcaption>{dirEntry.name}</figcaption>
      </figure>
    </div>
  );
}
