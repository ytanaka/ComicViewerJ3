import { useQuery, useQueryClient } from '@tanstack/react-query';

import { FileInfo, handleRustCmdResult, rustcmds, TabInfo } from '@/lib/bindings-wrapper';
import { myQueryClient } from '@/lib/query-client';
import { FileId, TabId } from '@/store/tab/types';
import { queryKey_tabId } from './tab';

// ---------------------------------------------------------------------------------------------------------------------
// タブ内の個々のファイルを表示するための情報取得

function queryKey_useFileInfosQuery(tabInfo: TabInfo, fileIds: FileId[]) {
  return [...queryKey_tabId(tabInfo.id), 'getFileInfos', fileIds];
}
function queryKey_useFileInfo1Query(tabId: TabId, fileId: FileId) {
  return [...queryKey_tabId(tabId), 'getFileInfo1', fileId];
}
export function useCmdFileInfosQuery(tabInfo: TabInfo, fileIds: FileId[]) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKey_useFileInfosQuery(tabInfo, fileIds),
    queryFn: async () => {
      const result = await rustcmds.getFileInfos(tabInfo.id, fileIds);
      handleRustCmdResult(
        result,
        `rustcmds.getFileInfos(${tabInfo.id},[${fileIds.length}:${Math.min(...fileIds)}-${Math.max(...fileIds)}])`,
        'ファイル情報取得失敗',
        list => {
          // ここで取得したデータは個別に取得するので、キャッシュに格納しておく
          list.forEach(fileInfo => {
            queryClient.setQueryData(queryKey_useFileInfo1Query(tabInfo.id, fileInfo.file_id), fileInfo);
          });
        }
      );
      return result;
    },
    enabled: 0 < tabInfo.id && 0 < fileIds.length,
    select: () => {
      return undefined; // このhookの戻り値を使用することはないのでデータを返す必要はない
    },
  });
}
export function useFileInfo1Query(tabInfo: TabInfo, fileId: FileId) {
  return useQuery<FileInfo | undefined>({
    queryKey: queryKey_useFileInfo1Query(tabInfo.id, fileId),
    queryFn: () => {
      throw new Error(`fileInfo is not loaded: tabId(${tabInfo.id}), fileId(${fileId})`);
    },
    enabled: false,
  });
}
export function getQueryData_getFileInfo1(tabId: TabId, fileId: FileId): FileInfo | undefined {
  return myQueryClient.getQueryData<FileInfo>(queryKey_useFileInfo1Query(tabId, fileId));
}
export function setQueryData_getFileInfo1(tabId: TabId, fileId: FileId, fileInfo: FileInfo) {
  myQueryClient.setQueryData(queryKey_useFileInfo1Query(tabId, fileId), fileInfo);
}
