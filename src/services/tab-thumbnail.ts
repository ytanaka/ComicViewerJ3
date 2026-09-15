import { FileId, TabId } from '@/store/tab/types';
import { useQuery } from '@tanstack/react-query';
import { queryKey_tabId } from './tab';
import { handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';
import { isPictureFileExtension } from '@/lib/string-util';

function queryKey_useThumbnailPath(tabId: TabId, fileId: FileId, size: number) {
  return [...queryKey_tabId(tabId), 'getThumbnail', fileId, size];
}

export function useThumbnailPath(tabId: TabId, fileId: FileId, size: number, filename: string) {
  return useQuery({
    queryKey: queryKey_useThumbnailPath(tabId, fileId, size),
    enabled: isPictureFileExtension(filename),
    retry: true,
    retryDelay: failureCount => {
      const base = 10;          // 初回 10ms
      const delay = base * 2 ** (failureCount - 1); // 10 → 20 → 40 → 80 → ...
      return Math.min(delay, 1000); // 最大 1000ms に制限
    },
    queryFn: async () => {
      const result = await rustcmds.getThumbnail(tabId, fileId, size);
      const comment = `rustcmds.getThumbnail(${tabId}, ${fileId}, ${size})`;
      handleRustCmdResult(result, comment, 'サムネイル画像取得失敗');
      if (result.status === 'error') {
        return undefined;
      } else if (result.data.type === 'Busy') {
        console.debug(comment, 'busy retry');
        throw new Error("Busy"); // リトライさせる
      } else {
        return result.data;
      }
    },
    select: (data) => {
      return data?.filename
    }
  });
}
