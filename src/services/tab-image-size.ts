import { FileId, TabId } from '@/store/tab/types';
import { useQuery } from '@tanstack/react-query';
import { queryKey_tabId } from './tab';
import { DirEntry, handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/tools/string-util';

function queryKey_useImageSize(tabId: TabId, fileId: FileId | undefined) {
  return [...queryKey_tabId(tabId), 'getImageSize', fileId];
}

export function useImageSize(tabId: TabId, dirEntry: DirEntry | undefined) {
  return useQuery({
    queryKey: queryKey_useImageSize(tabId, dirEntry?.file_id),
    enabled: dirEntry && isPictureFileExtension(dirEntry.name),
    queryFn: async () => {
      const result = await rustcmds.getImageSize(tabId, dirEntry!.file_id);
      const comment = `rustcmds.getImageSize(${tabId}, ${dirEntry!.file_id}`;
      handleRustCmdResult(result, comment, '画像サイズ取得失敗');
      return result;
    },
    select: data => {
      if (data.status === 'error') {
        return undefined; // queryFn で toast 表示済み
      }
      if (data.data === null) return undefined
      return data.data;
    },
  });
}
