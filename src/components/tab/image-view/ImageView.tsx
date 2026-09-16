import { DirEntry } from "@/lib/bindings-wrapper";
import { isPictureFileExtension } from "@/lib/string-util";
import { useListScrollHandlerStore } from "@/store/list-scroll-handler-store";
import { useTabStore } from "@/store/tab/store";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join as tauri_join } from "@tauri-apps/api/path";
import { useEffect, useState } from "react";
import { FileIconByFileInfo } from "../FileIconByFileInfo";

export function ImageView({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  const focusIndex = useTabStore(state => state.getCurrentTab()?.selection.focusIndex) ?? 0;

  const setRows = useListScrollHandlerStore(state => state.setRows);
  const setColumns = useListScrollHandlerStore(state => state.setColumns);
  const setScrollHandler = useListScrollHandlerStore(state => state.setScrollHandler);
  setRows(10);
  setColumns(1);
  setScrollHandler(null);

  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const getImagePaths = (i: number): string | undefined => {
    return imagePaths[i];
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
  const img0 = getImagePaths(focusIndex);

  console.debug(`<ImageView> ${tab.path} img0=${img0}`);

  if (!dirEntries || dirEntries.length === 0) {
    return <div>ファイルがありません</div>;
  } else if (noImage || !img0) {
    return <div>
      <div className='flex flex-col overflow-hidden'>
        <div className="min-w-[1lh] w-[3lh]">
          <FileIconByFileInfo dirEntry={dirEntries[focusIndex]} />
        </div>
        <div className='flex-1'>
          {dirEntries[focusIndex].name}
        </div>
      </div>
    </div>;
  } else {
    return (
      <div>
        <img src={convertFileSrc(img0)} />
      </div>
    );
  }
}
