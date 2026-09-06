import { DirEntry, FileInfo, RustCmdResult, rustcmds, TabInfo } from '@/lib/bindings-wrapper';
import { myQueryClient } from '@/lib/query-client';
import { useTabStore } from '@/store/tab/store';
import { FileId, TabId } from '@/store/tab/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// タブ関連の queryKey はこれを先頭に入れ、次に TabId を入れる
// タブを消すときはまとめて消す
const HEAD_QUERY_KEY_FOR_TAB_ID = 'tabId';

export function removeQueries_tab(tabId: TabId) {
  myQueryClient.removeQueries({ queryKey: [HEAD_QUERY_KEY_FOR_TAB_ID, tabId] });
}

// ---------------------------------------------------------------------------------------------------------------------
export function queryKey_useCmdCreateTab(tabInfo: TabInfo) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabInfo.id, 'createTab'];
}

export function useCmdCreateTab(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdCreateTab(tabInfo),
    queryFn: async () => await rustcmds.createTab(tabInfo.path),
    enabled: tabInfo.id < 0,
    select: data => {
      if (data.status === 'error') {
        // TODO error
        return undefined;
      } else {
        useTabStore.getState().updateTab(tabInfo.id, data.data);
        return data.data;
      }
    },
  });
}

// ---------------------------------------------------------------------------------------------------------------------

export function queryKey_useCmdGetDirEntries(tabId: TabId) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabId, 'getDirEntries'];
}
export function useCmdGetDirEntries(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdGetDirEntries(tabInfo.id),
    queryFn: async () => await rustcmds.getDirEntries(tabInfo.id),
    enabled: 0 < tabInfo.id,
    select: data => {
      return select_getDirEntries(data);
    },
  });
}
function select_getDirEntries(data: RustCmdResult<DirEntry[]>) {
  if (data.status === 'error') {
    // TODO
    return undefined;
  } else {
    return data.data;
  }
}
export function getQueryData_getDirEntries(tabId: TabId): DirEntry[] | undefined {
  const data = myQueryClient.getQueryData<RustCmdResult<DirEntry[]>>(queryKey_useCmdGetDirEntries(tabId));
  if (!data) return undefined;
  return select_getDirEntries(data);
}
export function getQueryData_getDirEntry(tabId: TabId, fileIndex: number): DirEntry | undefined {
  const dirEntries = getQueryData_getDirEntries(tabId);
  if (!dirEntries) return undefined;
  if (fileIndex < 0 || dirEntries.length <= fileIndex) return undefined;
  return dirEntries[fileIndex];
}
export function removeQueries_getDirEntries(tabId: TabId) {
  myQueryClient.removeQueries({ queryKey: queryKey_useCmdGetDirEntries(tabId) });
}
// ---------------------------------------------------------------------------------------------------------------------

export function queryKey_useFileInfosQuery(tabInfo: TabInfo, fileIds: FileId[]) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabInfo.id, 'getFileInfos', fileIds];
}
export function queryKey_useFileInfo1Query(tabInfo: TabInfo, fileId: FileId) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabInfo.id, 'getFileInfo', fileId];
}
export function useCmdFileInfosQuery(tabInfo: TabInfo, fileIds: FileId[]) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKey_useFileInfosQuery(tabInfo, fileIds),
    queryFn: () => rustcmds.getFileInfos(tabInfo.id, fileIds),
    enabled: 0 < fileIds.length,
    staleTime: 30_000,
    select: data => {
      if (data.status === 'error') {
        // TODO
        return undefined;
      } else {
        data.data.forEach(fileInfo => {
          queryClient.setQueryData(queryKey_useFileInfo1Query(tabInfo, fileInfo.file_id), fileInfo);
        });
        return undefined; // TODO このhookはFileList内部に記述されるので、データを取得しても更新しないようにする
      }
    },
  });
}
export function useFileInfo1Query(tabInfo: TabInfo, fileId: FileId) {
  return useQuery<FileInfo | undefined>({
    queryKey: queryKey_useFileInfo1Query(tabInfo, fileId),
    queryFn: () => {
      throw new Error(`fileInfo is not loaded: tabId(${tabInfo.id}), fileId(${fileId})`);
    },
    enabled: false,
  });
}
