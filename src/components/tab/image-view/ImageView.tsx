import { useEffect, useRef, useState } from 'react';

import { DirEntry } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/tools/string-util';
import { useListScrollHandlerStore } from '@/store/list-scroll-handler-store';
import { useTabStore } from '@/store/tab/store';
import { convertFileSrc } from '@tauri-apps/api/core';
import { FileIconByFileInfo } from '../FileIconByFileInfo';
import { getImageWH } from './iamge-view-size-helper';
import { useUiStore } from '@/store/ui-store';
import { imageView_handleKeyDown } from '@/lib/event-handler/image-view-key-handler';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { useResizedImagePath } from '@/services/tab-resized-image';
import { GetResizedImgResult, Dimension } from '@/lib/bindings';
import { useImageSize } from '@/services/tab-image-size';

export function ImageView({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  const focusIndex = useTabStore(state => state.getCurrentTab()?.selection.focusIndex) ?? 0;

  // 画面サイズ管理
  const divRef = useRef<HTMLDivElement>(null);
  const [divSize, setDivSize] = useState<Dimension | null>(null);
  useEffect(() => {
    if (!divRef.current) return;

    // window.addEventListener('resize', xxx); ではフルスクリーン切り替え時のサイズ取得に失敗した
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      setDivSize({ width, height });
    });
    observer.observe(divRef.current);

    return () => observer.disconnect();
  }, []);

  // 行数、列数の設定
  // ※ TabContent で共通処理をしているイベントハンドラーが使っている
  const setRows = useListScrollHandlerStore(state => state.setRows);
  const setColumns = useListScrollHandlerStore(state => state.setColumns);
  const setScrollHandler = useListScrollHandlerStore(state => state.setScrollHandler);
  setRows(10);
  setColumns(1);
  setScrollHandler(null);

  // 画像サイズ
  const { data: imageSize0 } = useImageSize(tab.id, dirEntries?.[focusIndex]);
  const { data: imageSize1 } = useImageSize(tab.id, dirEntries?.[focusIndex + 1]);
  const { data: imageSize2 } = useImageSize(tab.id, dirEntries?.[focusIndex + 2]);
  const { data: imageSize3 } = useImageSize(tab.id, dirEntries?.[focusIndex + 3]);
  useImageSize(tab.id, dirEntries?.[focusIndex - 1]);
  useImageSize(tab.id, dirEntries?.[focusIndex - 2]);
  const imageSizes = [imageSize0, imageSize1, imageSize2, imageSize3,];
  function getImageSize(i: number) {
    const size = imageSizes[i];
    if (size) return size;
    return { width: 0, height: 0 };
  }

  // 画像ファイル取得
  const { data: img0 } = useResizedImagePath(tab.id, dirEntries?.[focusIndex], divSize);
  if (img0?.type === 'Fail') {
    // TODO
    console.error(`${img0.error_msg}`)
  }
  const { data: img1 } = useResizedImagePath(tab.id, dirEntries?.[focusIndex + 1], divSize);
  const { data: img2 } = useResizedImagePath(tab.id, dirEntries?.[focusIndex + 2], divSize);
  const { data: img3 } = useResizedImagePath(tab.id, dirEntries?.[focusIndex + 3], divSize);
  useResizedImagePath(tab.id, dirEntries?.[focusIndex - 1], divSize);
  useResizedImagePath(tab.id, dirEntries?.[focusIndex - 2], divSize);
  function getImgPath(result?: GetResizedImgResult) {
    if (result?.type === 'Ok') return result.filename;
    return undefined;
  }
  const imgs = [getImgPath(img0), getImgPath(img1), getImgPath(img2), getImgPath(img3)];

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
  });

  // マウスカーソルを隠す
  const timer = useRef<number | undefined>(undefined);
  function showCursor(b: boolean) {
    if (useUiVolatileStore.getState().isFullscreen && useUiStore.getState().hideMouseCursorWhenFullscreen) {
      document.body.style.cursor = b ? 'default' : 'none';
    }
  }
  useEffect(() => {
    const handleMove = () => {
      showCursor(true);

      if (timer.current) clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        showCursor(false);
      }, 1000);
    };

    showCursor(false);
    window.addEventListener('mousemove', handleMove);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.body.style.cursor = 'default';
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const notImage = !isPictureFileExtension(dirEntries?.[focusIndex].name ?? '');
  const dualView = useTabStore(state => state.getCurrentTab()?.imageViewMode.dualImage) ?? false;
  const zoomLevel = useTabStore(state => state.getCurrentTab()?.imageViewMode.zoomLevel) ?? 0;
  const [styleImgSize0, styleImgSize1] = getImageWH({ imageSize0: getImageSize(0), imageSize1: getImageSize(1), dualView, zoomLevel, divSize });

  console.debug(`<ImageView> ${tab.path} focusIndex=${focusIndex} zoom=${zoomLevel} size0=`, getImageSize(0), '=>', styleImgSize0);

  const rendering = useUiStore(state => state.imageRendering);

  return (
    <div ref={divRef} className='flex w-full h-full max-w-full max-h-full'>
      <div className="flex-1 min-h-0, min-w-0 overflow-auto">
        {!dirEntries || dirEntries.length === 0 ? (
          // 空ディレクトリ
          <div>ファイルがありません</div>
        ) : notImage || !imgs[0] ? (
          // 画像ファイルでない
          <div className="flex flex-col overflow-hidden p-3">
            <div className="min-w-[1lh] w-[3lh]">
              <FileIconByFileInfo dirEntry={dirEntries[focusIndex]} />
            </div>
            <div className="flex-1">{dirEntries[focusIndex].name}</div>
          </div>
        ) : (
          // 画像表示
          <div
            className="flex justify-center items-center min-w-full min-h-full"
            style={{ width: styleImgSize0.width + styleImgSize1.width, height: Math.max(styleImgSize0.height, styleImgSize1.height) }}
          >
            {imgs[1] && (
              <img
                src={convertFileSrc(imgs[1])}
                style={{
                  imageRendering: rendering,
                  ...styleImgSize1,
                }}
                draggable={false}
              />
            )}
            <img
              src={convertFileSrc(imgs[0])}
              style={{
                imageRendering: rendering,
                ...styleImgSize0,
              }}
              draggable={false}
            />
            {imgs[2] && (
              <img
                src={convertFileSrc(imgs[2])}
                style={{
                  display: 'none',
                  visibility: 'hidden',
                }}
              />
            )}
            {imgs[3] && (
              <img
                src={convertFileSrc(imgs[3])}
                style={{
                  display: 'none',
                  visibility: 'hidden',
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
