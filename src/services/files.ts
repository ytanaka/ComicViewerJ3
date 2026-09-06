import { FileInfo, rustcmds, TabInfo } from "@/lib/bindings-wrapper";
import { useTabStore } from "@/store/tab/store";
import { FileId } from "@/store/tab/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ---------------------------------------------------------------------------------------------------------------------
export function queryKey_useCmdCreateTab(tabInfo: TabInfo) {
  return ["createTab", tabInfo.id];
}

export function useCmdCreateTab(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdCreateTab(tabInfo),
    queryFn: async () => await rustcmds.createTab(tabInfo.path),
    enabled: tabInfo.id < 0,
    select: (data) => {
      if (data.status === 'ok') {
        useTabStore.getState().updateTab(tabInfo.id, data.data)
      }
      return data;
    },
  });
}

// ---------------------------------------------------------------------------------------------------------------------

export function queryKey_useCmdGetDirEntries(tabInfo: TabInfo) {
  return ["getDirEntries", tabInfo.id];
}
export function useCmdGetDirEntries(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdGetDirEntries(tabInfo),
    queryFn: async () => await rustcmds.getDirEntries(tabInfo.id),
    enabled: 0 < tabInfo.id,
  });
}

// ---------------------------------------------------------------------------------------------------------------------

export function queryKey_useFileInfosQuery(tabInfo: TabInfo, startFileIndex: number, endFileIndex: number) {
  return ["getFileInfos", tabInfo.id, startFileIndex, endFileIndex];
}
export function queryKey_useFileInfo1Query(tabInfo: TabInfo, fileId: FileId) {
  return ["getFileInfo", tabInfo.id, fileId];
}
export function useCmdFileInfosQuery(tabInfo: TabInfo, startFileIndex: number, endFileIndex: number) {
  const queryClient = useQueryClient();
  const fileIds: FileId[] = []; // TODO
  return useQuery({
    queryKey: queryKey_useFileInfosQuery(tabInfo, startFileIndex, endFileIndex),
    queryFn: () => rustcmds.getFileInfos(tabInfo.id, fileIds),
    enabled: 0 < fileIds.length,
    staleTime: 30_000,
    select: (data) => {
      if (data.status === 'ok') {
        data.data.forEach((fileInfo) => {
          queryClient.setQueryData(queryKey_useFileInfo1Query(tabInfo, fileInfo.file_id), fileInfo);
        })
      }
      return data;
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
