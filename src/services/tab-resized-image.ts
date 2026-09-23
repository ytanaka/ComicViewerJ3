import { FileId, TabId } from '@/store/tab/types';
import { useQuery } from '@tanstack/react-query';
import { queryKey_tabId } from './tab';
import { DirEntry, handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/tools/string-util';
import { usePreferences } from './preferences';
import { Dimension } from '@/lib/bindings';
import { myQueryClient } from '@/lib/query-client';

function queryKey_useResizedImage(tabId: TabId, fileId: FileId | undefined, size: Dimension | null) {
  return [...queryKey_tabId(tabId), 'getResizedImg', fileId, size?.width, size?.height];
}
function queryKey_useResizedImage_no_dimension(tabId: TabId, fileId: FileId | undefined) {
  return [...queryKey_tabId(tabId), 'getResizedImg', fileId];
}

let running = 0;

export function useResizedImage(tabId: TabId, dirEntry: DirEntry | undefined, size: Dimension | null) {
  const { data: pref } = usePreferences();
  const LIMIT = pref?.resize_image_command_limit ?? 4;
  const enable = !!size && dirEntry && isPictureFileExtension(dirEntry.name);

  return useQuery({
    queryKey: queryKey_useResizedImage(tabId, dirEntry?.file_id, size),
    enabled: enable,
    retry: enable,
    retryDelay: 10,
    queryFn: async () => {
      if (LIMIT <= running) {
        throw new Error('Too many concurrent queries');
      }
      running++;

      try {
        const result = await rustcmds.getResizedImg(tabId, dirEntry!.file_id, size!);
        const comment = `rustcmds.getResizedImg(${tabId}, ${dirEntry!.file_id}, ${size?.width}x${size?.height}) running[${running}]`;
        handleRustCmdResult(result, comment, '画像リサイズ失敗');
        if (result.status === 'ok' && result.data.type === 'Busy') {
          console.debug(comment, 'busy retry');
          throw new Error('Busy'); // リトライさせる
        }
        return result;
      } finally {
        running--;
      }
    },
    select: data => {
      if (data.status === 'error') {
        return undefined; // queryFn で toast 表示済み
      }
      return data.data;
    },
  });
}
export function removeQueries_resizedImage(tabId: TabId, fileId: FileId | undefined) {
  myQueryClient.removeQueries({ queryKey: queryKey_useResizedImage_no_dimension(tabId, fileId) });
}
