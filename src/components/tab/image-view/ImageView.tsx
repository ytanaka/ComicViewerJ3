import React, { useEffect, useRef, useState } from 'react';

import { DirEntry } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/tools/string-util';
import { useListScrollHandlerStore } from '@/store/list-scroll-handler-store';
import { useTabStore } from '@/store/tab/store';
import { convertFileSrc } from '@tauri-apps/api/core';
import { FileIconByFileInfo } from '../FileIconByFileInfo';
import { getImageWH, ImageWidthHeight } from './iamge-view-size-helper';
import { useImageFullpath } from '../../../hooks/use-image-fullpath';
import { useUiStore } from '@/store/ui-store';
import { imageView_handleKeyDown } from '@/lib/event-handler/image-view-key-handler';

export function ImageView({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  const focusIndex = useTabStore(state => state.getCurrentTab()?.selection.focusIndex) ?? 0;

  // 画面サイズ管理
  const divRef = useRef<HTMLDivElement>(null);
  const [divSize, setDivSize] = useState<ImageWidthHeight | null>(null);
  useEffect(() => {
    const update = () => {
      const rect = divRef.current?.getBoundingClientRect();
      if (rect) setDivSize({ width: rect.width, height: rect.height });
    };
    window.addEventListener('resize', update);
    update();

    return () => window.removeEventListener('resize', update);
  }, []);

  const setRows = useListScrollHandlerStore(state => state.setRows);
  const setColumns = useListScrollHandlerStore(state => state.setColumns);
  const setScrollHandler = useListScrollHandlerStore(state => state.setScrollHandler);
  setRows(10);
  setColumns(1);
  setScrollHandler(null);

  // 画像ファイルのフルパス
  const { data: imagePaths } = useImageFullpath(tab.id);
  const getImagePaths = (i: number): string | undefined => {
    return imagePaths?.[i];
  };

  // 画像のサイズ (<img> で読み込んだ後で設定される)
  const [imageInfos, setImageInfos] = useState<ImageWidthHeight[]>([]);
  const handleImageLoad = (index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageInfos(prev => {
      const copy = [...prev];
      copy[index] = { width: img.naturalWidth, height: img.naturalHeight };
      return copy;
    });
  };

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      const timeout = useUiStore.getState().timeoutMsEventTimeStamp;
      if (0 < timeout && timeout < delay) {
        console.info('ignore keyboard event');
        return;
      }

      if (imageView_handleKeyDown(e)) {
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // 初回だけ実行する

  const noImage = !isPictureFileExtension(getImagePaths(focusIndex) ?? '');

  const imgs = [
    getImagePaths(focusIndex),
    getImagePaths(focusIndex + 1),
    getImagePaths(focusIndex + 2),
    getImagePaths(focusIndex + 3),
  ];

  const dualView = useTabStore(state => state.getCurrentTab()?.imageViewMode.dualImage) ?? false;
  const uiZoom = useTabStore(state => state.getCurrentTab()?.imageViewMode.zoomLevel) ?? 1;
  const [imgSize0, imgSize1] = getImageWH({ imageInfos, fileIndex: focusIndex, dualView, zoomLevel: uiZoom, divSize });

  console.debug(`<ImageView> ${tab.path} focusIndex=${focusIndex} img0=${imgs[0]}`);

  // const rendering = 'crisp-edges';
  // const rendering = 'pixelated';
  const rendering = 'smooth';

  return (
    <div ref={divRef} className="w-full h-full">
      {!dirEntries || dirEntries.length === 0 ? (
        // 空ディレクトリ
        <div>ファイルがありません</div>
      ) : noImage || !imgs[0] ? (
        // 画像ファイルでない
        <div className="flex flex-col overflow-hidden">
          <div className="min-w-[1lh] w-[3lh]">
            <FileIconByFileInfo dirEntry={dirEntries[focusIndex]} />
          </div>
          <div className="flex-1">{dirEntries[focusIndex].name}</div>
        </div>
      ) : (
        // 画像表示
        <>
          <img
            src={convertFileSrc(imgs[0])}
            style={{
              imageRendering: rendering,
              ...imgSize0,
            }}
            draggable={false}
            onLoad={e => handleImageLoad(focusIndex, e)}
          />
          {imgs[1] && (
            <img
              src={convertFileSrc(imgs[1])}
              style={{
                imageRendering: rendering,
                ...imgSize1,
              }}
              draggable={false}
              onLoad={e => handleImageLoad(focusIndex + 1, e)}
            />
          )}
        </>
      )}
    </div>
  );
}
