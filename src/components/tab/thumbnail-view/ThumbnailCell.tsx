import { DirEntry, TabInfo } from '@/lib/bindings-wrapper';
import { useThumbnailPath } from '@/services/tab-thumbnail';
import { convertFileSrc } from '@tauri-apps/api/core';
import { THUMBNAIL_CELL_CLASSNAME, THUMBNAIL_SIZE_DEFAULT } from './Thumbnails';
import { cn } from '@/lib/utils';
import { useTabStore } from '@/store/tab/store';
import { useFileInfo1Query } from '@/services/tab-file-info';
import { tabFiles_handleMouseClick } from '@/lib/event-handler/tab-files-key-handler';
import React from 'react';
import { unixTime2str } from '@/lib/string-util';
import { FileIconByFileInfo } from '../FileIconByFileInfo';
import { SearchResult } from '../SearchResult';

export function ThumbnailCell({ tab, fileIndex, dirEntry }: { tab: TabInfo; fileIndex: number; dirEntry: DirEntry }) {
  const isSelected = useTabStore(state => state.getTab(tab.id)?.selection.selectionIndexes.has(fileIndex));
  const isFocused = useTabStore(state => state.getTab(tab.id)?.selection.focusIndex === fileIndex);
  const { data: fileInfo } = useFileInfo1Query(tab, dirEntry.file_id);
  const errorMsg = fileInfo?.metadata.Left;
  const thumbSize = useTabStore(state => state.getCurrentTab()?.thumbnailSize) ?? THUMBNAIL_SIZE_DEFAULT;

  let toolTipMsg = dirEntry.name;
  if (errorMsg) toolTipMsg += '\nERROR: ' + errorMsg;
  if (fileInfo?.metadata.Right) {
    const meta = fileInfo.metadata.Right;
    if (meta.size) toolTipMsg += `\nサイズ: ${meta.size.toLocaleString()}`;
    if (meta.modified) toolTipMsg += `\n更新日時: ${unixTime2str(meta.modified)}`;
  }

  // サムネイル画像ファイル作成
  const { data: thumbData } = useThumbnailPath(tab.id, dirEntry, thumbSize);
  if (!dirEntry.is_dir && thumbData?.type === 'Fail') {
    toolTipMsg += `\n\n画像読み込みエラー:\n${thumbData.error_msg}`;
  }

  // マウスクリック
  function handleClick(e: React.MouseEvent) {
    tabFiles_handleMouseClick(e, tab, fileIndex);
  }

  if (fileIndex === 0) console.debug(`<ThumbnailCell>[${fileIndex}] tabId:${tab.id}`);

  const select_style = 'dark:bg-blue-700 bg-blue-300 dark:text-white text-black';
  const border = isFocused && 'outline-dashed outline dark:outline-white outline-black';

  return (
    <div
      className={cn(THUMBNAIL_CELL_CLASSNAME, border, 'overflow-clip', isSelected && select_style)}
      onClick={handleClick}
      title={toolTipMsg}
    >
      <div>
        {thumbData?.type !== 'Ok' ? (
          <div
            className="border-2"
            style={{
              display: 'block',
              width: thumbSize,
              height: thumbSize,
            }}
          >
            <div className="min-w-[1lh] w-[3lh]">
              <FileIconByFileInfo dirEntry={dirEntry} fileInfo={fileInfo} />
            </div>
          </div>
        ) : (
          <img
            src={convertFileSrc(thumbData.filename)}
            loading="lazy"
            className={cn(!dirEntry.is_dir ? 'border-2' : isSelected ? select_style : 'bg-yellow-500 rounded')}
            style={{
              display: 'block',
              width: thumbSize,
              height: thumbSize,
              objectFit: 'contain',
            }}
          />
        )}
        <div className="truncate" style={{ width: thumbSize }}>
          {dirEntry.name}
        </div>
        {isSelected && <SearchResult tabInfo={tab} />}
      </div>
    </div>
  );
}
