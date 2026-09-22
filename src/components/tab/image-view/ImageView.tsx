import { useEffect, useRef, useState } from 'react';

import { DirEntry } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/tools/string-util';
import { useListScrollHandlerStore } from '@/store/list-scroll-handler-store';
import { useTabStore } from '@/store/tab/store';
import { FileIconByFileInfo } from '../FileIconByFileInfo';
import { getImageWH } from './iamge-view-size-helper';
import { useUiStore } from '@/store/ui-store';
import { imageView_handleKeyDown } from '@/lib/event-handler/image-view-key-handler';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { useResizedImagePath } from '@/services/tab-resized-image';
import { Dimension } from '@/lib/bindings';
import { useImageSize } from '@/services/tab-image-size';
import { useImageFullpath } from '@/hooks/use-image-fullpath';
import { ImageViewCell } from './ImageViewCell';
import { zoomDimension } from '@/lib/tools/image-zoom';

export function ImageView({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  const focusIndex = useTabStore(state => state.getCurrentTab()?.selection.focusIndex) ?? 0;
  const zoomLevel = useTabStore(state => state.getCurrentTab()?.imageViewMode.zoomLevel) ?? 0;
  const originalSize = useTabStore(state => state.getCurrentTab()?.imageViewMode.useOriginalSize) ?? false;

  // 画面サイズ管理
  const divRef = useRef<HTMLDivElement>(null);
  const [divSize, setDivSize] = useState<Dimension | undefined>(undefined);
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

  // 画像サイズ取得
  const { data: imageSize0 } = useImageSize(tab.id, dirEntries?.[focusIndex]);
  const { data: imageSize1 } = useImageSize(tab.id, dirEntries?.[focusIndex + 1]);
  useImageSize(tab.id, dirEntries?.[focusIndex + 2]);
  useImageSize(tab.id, dirEntries?.[focusIndex + 3]);
  useImageSize(tab.id, dirEntries?.[focusIndex - 1]);
  useImageSize(tab.id, dirEntries?.[focusIndex - 2]);

  // オリジナル画像ファイルのフルパス
  const { data: originalImagePaths } = useImageFullpath(tab.id);

  // 画像ファイル取得
  const zoomedDivSize = zoomDimension(zoomLevel, originalSize ? imageSize0 : divSize);
  function ent(fileIndex: number) {
    return originalSize ? undefined : dirEntries?.[fileIndex];
  }
  const { data: img0 } = useResizedImagePath(tab.id, ent(focusIndex), zoomedDivSize);
  if (img0?.type === 'Fail') {
    // TODO
    console.error(`${img0.error_msg}`);
  }
  const { data: img1 } = useResizedImagePath(tab.id, ent(focusIndex + 1), zoomedDivSize);
  const { data: img2 } = useResizedImagePath(tab.id, ent(focusIndex + 2), zoomedDivSize);
  const { data: img3 } = useResizedImagePath(tab.id, ent(focusIndex + 3), zoomedDivSize);
  useResizedImagePath(tab.id, originalSize ? undefined : dirEntries?.[focusIndex - 1], zoomedDivSize);
  useResizedImagePath(tab.id, originalSize ? undefined : dirEntries?.[focusIndex - 2], zoomedDivSize);

  // 最終表示画像取得 (i: 0-3) 原寸表示時は、リサイズしない画像ファイル名を返す
  function getResizedImagePath(i: number) {
    const imgs = [img0, img1, img2, img3];
    if (originalSize) return originalImagePaths?.[focusIndex + i];
    const result = imgs[i];
    if (result?.type === 'Ok') return result.filename;
    return undefined;
  }

  // キー操作
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      const timeout = useUiStore.getState().timeoutMsEventTimeStamp;
      if (0 < timeout && timeout < delay) {
        console.info('ignore keyboard event');
        return;
      }

      if (await imageView_handleKeyDown(e)) {
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
  const reverseDualView = useTabStore(state => state.getCurrentTab()?.imageViewMode.reverseDualImage) ?? false;
  const [styleImgSize0, styleImgSize1] = getImageWH({
    imageSize0,
    imageSize1,
    dualView,
    zoomLevel,
    screenSize: originalSize ? imageSize0 : divSize,
  });

  console.debug(
    `<ImageView> ${tab.path} focusIndex=${focusIndex} zoom=${zoomLevel} size=${imageSize0?.width}x${imageSize0?.height} => ${styleImgSize0.width}x${styleImgSize0.height}`
  );

  const imgViewCell0 = (
    <ImageViewCell
      key={`${tab.id}/${focusIndex}/${getResizedImagePath(0)}`} // 拡大縮小時にコンポーネントをリセットするため、キーにパスを含める
      tab={tab}
      dirEntry={dirEntries?.[focusIndex]}
      originalImagePath={originalImagePaths?.[focusIndex]}
      resizedImagePath={getResizedImagePath(0)}
      size={styleImgSize0}
      hidden={false}
      debugPrint={true}
    />
  );
  const imgViewCell1 = (
    <ImageViewCell
      key={`${tab.id}/${focusIndex + 1}/${getResizedImagePath(1)}`}
      tab={tab}
      dirEntry={dirEntries?.[focusIndex + 1]}
      originalImagePath={originalImagePaths?.[focusIndex + 1]}
      resizedImagePath={getResizedImagePath(1)}
      size={styleImgSize1}
      hidden={!dualView}
    />
  );
  const imgViewCell2 = (
    <ImageViewCell
      key={`${tab.id}/${focusIndex + 2}`}
      tab={tab}
      originalImagePath={originalImagePaths?.[focusIndex + 2]}
      resizedImagePath={getResizedImagePath(2)}
      hidden={true}
    />
  );
  const imgViewCell3 = (
    <ImageViewCell
      key={`${tab.id}/${focusIndex + 3}`}
      tab={tab}
      originalImagePath={originalImagePaths?.[focusIndex + 3]}
      resizedImagePath={getResizedImagePath(3)}
      hidden={true}
    />
  );

  return (
    <div ref={divRef} className="flex w-full h-full max-w-full max-h-full">
      <div className="flex-1 min-h-0, min-w-0 overflow-auto">
        {!dirEntries || dirEntries.length === 0 ? (
          // 空ディレクトリ
          <div>ファイルがありません</div>
        ) : notImage ? (
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
            style={{
              width: styleImgSize0.width + styleImgSize1.width,
              height: Math.max(styleImgSize0.height, styleImgSize1.height),
            }}
          >
            {!reverseDualView ? (
              <>
                {imgViewCell1}
                {imgViewCell0}
              </>
            ) : (
              <>
                {imgViewCell0}
                {imgViewCell1}
              </>
            )}
            {imgViewCell2}
            {imgViewCell3}
          </div>
        )}
      </div>
    </div>
  );
}
