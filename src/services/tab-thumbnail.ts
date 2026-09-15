import { FileId, TabId } from '@/store/tab/types';
import { useQuery } from '@tanstack/react-query';
import { queryKey_tabId } from './tab';
import { handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/string-util';
import { usePreferences } from './preferences';

function queryKey_useThumbnailPath(tabId: TabId, fileId: FileId, size: number) {
  return [...queryKey_tabId(tabId), 'getThumbnail', fileId, size];
}

let running = 0;

export function useThumbnailPath(tabId: TabId, fileId: FileId, size: number, filename: string) {
  const { data: pref } = usePreferences();
  const LIMIT = pref?.thumbnail_command_limit ?? 4;

  return useQuery({
    queryKey: queryKey_useThumbnailPath(tabId, fileId, size),
    enabled: isPictureFileExtension(filename),
    retry: true,
    retryDelay: 10,
    queryFn: async () => {
      if (LIMIT <= running) {
        throw new Error("Too many concurrent queries");
      }
      running++;

      try {
        const result = await rustcmds.getThumbnail(tabId, fileId, size);
        const comment = `rustcmds.getThumbnail(${tabId}, ${fileId}, ${size}) running[${running}]`;
        handleRustCmdResult(result, comment, 'サムネイル画像取得失敗');
        if (result.status === 'error') {
          return undefined;
        } else if (result.data.type === 'Busy') {
          console.debug(comment, 'busy retry');
          throw new Error("Busy"); // リトライさせる
        } else {
          return result.data;
        }
      } finally {
        running--;
      }
    },
    select: (data) => {
      return data?.filename
    }
  });
}
