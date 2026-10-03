import { Dimension } from '@/lib/bindings';
import { DirEntry, TabInfo } from '@/lib/bindings-wrapper';
import { rotateLevel2Deg } from '@/lib/tools/image-rotate';
import { removeQueries_resizedImage } from '@/services/tab-resized-image';
import { useTabStore } from '@/store/tab/store';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useState } from 'react';

export interface ImageViewCellProps {
  originalImage: string | undefined;
  resizedImage: string | undefined;
  tab: TabInfo;
  dirEntry?: DirEntry;
  size?: Dimension;
  hidden: boolean;
  debugPrint?: boolean;
}

export function ImageViewCell(props: ImageViewCellProps) {
  const rotateLevel = useTabStore(state => state.getTab(props.tab.id)?.imageViewMode.rotateLevel);
  const rotateDeg = rotateLevel2Deg(rotateLevel ?? 0);

  function getAssetUrl(path: string | undefined) {
    if (!path) return undefined;
    return convertFileSrc(path);
  }

  const [readyResizedImage, setReadyResizedImage] = useState(false);

  if (props.debugPrint) {
    console.debug(
      `<ImageViewCell> ${props.dirEntry?.name} (${props.size?.width}x${props.size?.height}) ${props.originalImage} ${props.resizedImage}`
    );
  }

  function handleImageError() {
    console.info(
      `failed get resized image. remove query cache and re-create file. tabId=${props.tab.id} fileId=${props.dirEntry?.file_id}`
    );
    removeQueries_resizedImage(props.tab.id, props.dirEntry?.file_id);
  }

  return (
    <div
      className="relative"
      style={{
        display: props.hidden ? 'none' : undefined,
        visibility: props.hidden ? 'hidden' : undefined,
      }}
    >
      <img
        src={getAssetUrl(props.resizedImage)}
        draggable={false}
        style={{
          ...props.size,
          rotate: `${rotateDeg}deg`,
          imageRendering: 'pixelated',
          display: !readyResizedImage ? 'none' : undefined,
          visibility: !readyResizedImage ? 'hidden' : undefined,
        }}
        onLoad={() => setReadyResizedImage(true)}
        onError={handleImageError}
      />
      {!readyResizedImage && (
        <img
          src={getAssetUrl(props.originalImage)}
          draggable={false}
          style={{
            ...props.size,
            rotate: `${rotateDeg}deg`,
            imageRendering: 'smooth',
            display: readyResizedImage ? 'none' : undefined,
            visibility: readyResizedImage ? 'hidden' : undefined,
          }}
        />
      )}
      {!readyResizedImage && (
        <div className="absolute left-0 top-0 border-2 whitespace-nowrap text-black bg-white dark:text-white dark:bg-black">
          リサイズ中... {props.dirEntry?.name}
        </div>
      )}
    </div>
  );
}
