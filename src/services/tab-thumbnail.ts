import { FileId, TabId } from "@/store/tab/types";
import { useQuery } from "@tanstack/react-query";
import { queryKey_tabId } from "./tab";
import { handleRustCmdResult, rustcmds } from "@/lib/bindings-wrapper";

function queryKey_useThumbnailPath(tabId: TabId, fileId: FileId, size: number) {
  return [...queryKey_tabId(tabId), 'getThumbnail', fileId, size];
}

export function useThumbnailPath(tabId: TabId, fileId: FileId, size: number) {
  return useQuery({
    queryKey: queryKey_useThumbnailPath(tabId, fileId, size),
    queryFn: async () => {
      const result = await rustcmds.getThumbnail(tabId, fileId, size);
      handleRustCmdResult(result, `rustcmds.getThumbnail(${tabId}, ${fileId}, ${size})`, 'サムネイル画像取得失敗')
      if (result.status === 'error') {
        return undefined;
      } else {
        return result.data;
      }
    }
  })
}
