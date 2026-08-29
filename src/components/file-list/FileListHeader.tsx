import React, { useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';

import { useUiStore } from '@/store/ui-store';

export function FileListHeader() {
  const sizes = useUiStore(state => state.fileListHeaderSizes);
  const setFileListHeaderSize = useUiStore(state => state.setFileListHeaderSizes);

  const refList = useRef<(HTMLDivElement | null)[]>([]);
  const titles = ['', '名前', '拡張子', 'サイズ', '更新日時'];

  function handleLayoutChanged() {
    const sizes = titles.map((_, i) => {
      const div = refList.current[i];
      if (!div) return 50;
      return div.getBoundingClientRect().width;
    });
    setFileListHeaderSize(sizes);
  }

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-900">
      <ResizablePanelGroup orientation="horizontal" className="flex w-full" onLayoutChanged={handleLayoutChanged}>
        {titles.map((s, i) => {
          return (
            <React.Fragment key={i}>
              <ResizablePanel id={`${i}`} className="box-border" defaultSize={sizes[i]}>
                <div
                  ref={el => {
                    refList.current[i] = el;
                  }}
                  className="pl-1 text-ellipsis overflow-hidden text-nowrap"
                >
                  {s}
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </React.Fragment>
          );
        })}
      </ResizablePanelGroup>
    </div>
  );
}
