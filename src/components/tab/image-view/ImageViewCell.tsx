import { Dimension } from "@/lib/bindings"
import { DirEntry } from "@/lib/bindings-wrapper";
import { convertFileSrc } from "@tauri-apps/api/core"
import { useState } from "react";

export interface ImageViewCellProps {
  originalImagePath: string | undefined,
  resizedImagePath: string | undefined,
  dirEntry?: DirEntry,
  size?: Dimension,
  hidden: boolean,
  debugPrint?: boolean,
}

export function ImageViewCell(props: ImageViewCellProps) {
  function getAssetUrl(path: string | undefined) {
    if (!path) return undefined;
    return convertFileSrc(path);
  }

  const [readyResizedImage, setReadyResizedImage] = useState(false);

  if (props.debugPrint) {
    console.debug(`<ImageViewCell> ${props.dirEntry?.name} (${props.size?.width}x${props.size?.height}) ${props.originalImagePath} ${props.resizedImagePath}`);
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
        src={getAssetUrl(props.resizedImagePath)}
        draggable={false}
        style={{
          ...props.size,
          display: !readyResizedImage ? 'none' : undefined,
          visibility: !readyResizedImage ? 'hidden' : undefined,
        }}
        onLoad={() => setReadyResizedImage(true)}
      />
      {!readyResizedImage &&
        <img
          src={getAssetUrl(props.originalImagePath)}
          draggable={false}
          style={{
            ...props.size,
            display: readyResizedImage ? 'none' : undefined,
            visibility: readyResizedImage ? 'hidden' : undefined,
          }}
        />}
      {!readyResizedImage &&
        <div
          className="absolute left-0 top-0 border-2 whitespace-nowrap text-black bg-white dark:text-white dark:bg-black"
        >リサイズ中... {props.dirEntry?.name}
        </div>}
    </div>
  );
}