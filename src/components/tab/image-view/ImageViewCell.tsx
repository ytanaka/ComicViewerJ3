import { Dimension } from "@/lib/bindings"
import { DirEntry } from "@/lib/bindings-wrapper";
import { convertFileSrc } from "@tauri-apps/api/core"
import { useState } from "react";

export interface ImageViewCellProps {
  originalImagePath: string | undefined,
  resizedImagePath: string | undefined,
  dirEntry?: DirEntry,
  size?: Dimension,
  visible?: boolean,
}

export function ImageViewCell(props: ImageViewCellProps) {
  function getAssetUrl(path: string | undefined) {
    if (!path) return undefined;
    return convertFileSrc(path);
  }

  const [readyResizedImage, setReadyResizedImage] = useState(false);

  return (
    <div
      className="relative"
      style={{
        display: props.visible === false ? 'none' : undefined,
        visibility: props.visible === false ? 'hidden' : undefined,
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
          className="absolute left-0 top-0 border-2 text-black bg-white dark:text-white dark:bg-black"
        >リサイズ中... {props.dirEntry?.name}
        </div>}
    </div>
  );
}