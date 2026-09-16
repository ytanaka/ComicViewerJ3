import { DirEntry } from "@/lib/bindings-wrapper";
import { isPictureFileExtension } from "@/lib/string-util";
import { useListScrollHandlerStore } from "@/store/list-scroll-handler-store";
import { useTabStore } from "@/store/tab/store";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join as tauri_join } from "@tauri-apps/api/path";
import React, { useEffect, useRef, useState } from "react";
import { FileIconByFileInfo } from "../FileIconByFileInfo";
import { getImageWH, ImageWidthHeight } from "./iamge-view-helper";

export function ImageView({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [divSize, setDivSize] = useState<ImageWidthHeight | null>(null);
  useEffect(() => {
    const update = () => {
      const rect = divRef.current?.getBoundingClientRect();
      if (rect) setDivSize({ width: rect.width, height: rect.height });
    };
    window.addEventListener("resize", update);
    update();

    return () => window.removeEventListener("resize", update);
  }, []);

  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  const focusIndex = useTabStore(state => state.getCurrentTab()?.selection.focusIndex) ?? 0;

  const setRows = useListScrollHandlerStore(state => state.setRows);
  const setColumns = useListScrollHandlerStore(state => state.setColumns);
  const setScrollHandler = useListScrollHandlerStore(state => state.setScrollHandler);
  setRows(10);
  setColumns(1);
  setScrollHandler(null);

  // 画像ファイルのフルパス (async関数で作成するので、useState に格納する)
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const getImagePaths = (i: number): string | undefined => {
    return imagePaths[i];
  }

  // 画像のサイズ (<img> で読み込んだ後で設定される)
  const [imageInfos, setImageInfos] = useState<ImageWidthHeight[]>([]);
  const handleImageLoad = (index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageInfos((prev) => {
      const copy = [...prev];
      copy[index] = { width: img.naturalWidth, height: img.naturalHeight };
      return copy;
    });
  }

  useEffect(() => {
    async function getFilenames() {
      if (!dirEntries) return;
      const paths: string[] = [];
      for (let i = 0; i < dirEntries.length; i++) {
        const p = await tauri_join(tab.path, dirEntries[i].name);
        paths.push(p);
      }
      setImagePaths(paths);
    }
    getFilenames();
  }, [dirEntries, tab.path]);

  const noImage = !isPictureFileExtension(getImagePaths(focusIndex) ?? "");

  const imgs = [
    getImagePaths(focusIndex),
    getImagePaths(focusIndex + 1),
    getImagePaths(focusIndex + 2),
    getImagePaths(focusIndex + 3),
  ];

  const dualView = useTabStore(state => state.getCurrentTab()?.dualImage) ?? false;
  const uiZoom = useTabStore(state => state.getCurrentTab()?.imageZoom) ?? 1;
  const [imgSize0, imgSize1] = getImageWH({ imageInfos, fileIndex: focusIndex, dualView, uiZoom, divSize });

  console.debug(`<ImageView> ${tab.path}`, "divSize=", divSize, "img0=", imgs[0], "size0=", imgSize0);

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
        <div className='flex flex-col overflow-hidden'>
          <div className="min-w-[1lh] w-[3lh]">
            <FileIconByFileInfo dirEntry={dirEntries[focusIndex]} />
          </div>
          <div className='flex-1'>
            {dirEntries[focusIndex].name}
          </div>
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
            onLoad={(e) => handleImageLoad(focusIndex, e)}
          />
          {imgs[1] &&
            <img
              src={convertFileSrc(imgs[1])}
              style={{
                imageRendering: rendering,
                ...imgSize1,
              }}
              draggable={false}
              onLoad={(e) => handleImageLoad(focusIndex + 1, e)}
            />
          }
        </>
      )}
    </div>
  );
}
