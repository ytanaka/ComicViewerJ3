import { DirEntry, TabInfo } from "@/lib/bindings-wrapper";
import { useThumbnailPath } from "@/services/tab-thumbnail";
import { convertFileSrc } from "@tauri-apps/api/core";

const THUMBNAIL_SIZE = 128;

export function ThumbnailCell({ tab, fileIndex, dirEntry }: { tab: TabInfo; fileIndex: number; dirEntry: DirEntry }) {
  const { data: thumbPath } = useThumbnailPath(tab.id, dirEntry.file_id, THUMBNAIL_SIZE);

  if (fileIndex === 0) console.debug(`<ThumbnailCell>[${fileIndex}] tabId:${tab.id}`);

  return (<div>
    <figure>
      <img
        src={!thumbPath ? "" : convertFileSrc(thumbPath)}
        loading="lazy"
        style={{
          display: "block",
          width: THUMBNAIL_SIZE,
          height: THUMBNAIL_SIZE,
          objectFit: "none",
        }}
      />
      <figcaption>{dirEntry.name}</figcaption>
    </figure></div>);
}
