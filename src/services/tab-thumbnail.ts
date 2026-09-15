import { FileId, TabId } from '@/store/tab/types';
import { useQuery } from '@tanstack/react-query';
import { queryKey_tabId } from './tab';
import { DirEntry, handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/string-util';
import { usePreferences } from './preferences';

function queryKey_useThumbnailPath(tabId: TabId, fileId: FileId, size: number) {
  return [...queryKey_tabId(tabId), 'getThumbnail', fileId, size];
}

let running = 0;

export function useThumbnailPath(tabId: TabId, dirEntry: DirEntry, size: number) {
  const { data: pref } = usePreferences();
  const LIMIT = pref?.thumbnail_command_limit ?? 4;

  return useQuery({
    queryKey: queryKey_useThumbnailPath(tabId, dirEntry.file_id, size),
    enabled: isPictureFileExtension(dirEntry.name) || dirEntry.is_dir,
    retry: true,
    retryDelay: 10,
    queryFn: async () => {
      if (LIMIT <= running) {
        throw new Error('Too many concurrent queries');
      }
      running++;

      try {
        const result = await rustcmds.getThumbnail(tabId, dirEntry.file_id, size);
        const comment = `rustcmds.getThumbnail(${tabId}, ${dirEntry.file_id}, ${size}) running[${running}]`;
        handleRustCmdResult(result, comment, 'サムネイル画像取得失敗');
        if (result.status === 'error') {
          return undefined;
        } else if (result.data.type === 'Busy') {
          console.debug(comment, 'busy retry');
          throw new Error('Busy'); // リトライさせる
        } else if (result.data.type === 'NoImage') {
          return undefined; // 画像なし
        } else {
          return result.data;
        }
      } finally {
        running--;
      }
    },
    select: data => {
      return data?.filename;
    },
  });
}
