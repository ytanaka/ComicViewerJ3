import { DirEntry, FileInfo, logResult, RustCmdResult, rustcmds, TabInfo } from '@/lib/bindings-wrapper';
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
// タブ作成
// ※ zustand が localStrage から復元したタブはまだRust側と結び付けられていないので、ここで結び付ける
// ※ 普通のタブ作成は、タブ作成時に TabInfo.id が設定されているのでここでは処理しない

function queryKey_useCmdCreateTab(tabInfo: TabInfo) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabInfo.id, 'createTab'];
}

export function useCmdCreateTab(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdCreateTab(tabInfo),
    queryFn: async () => {
      const result = await rustcmds.createTab(tabInfo.path);
      logResult(`rustcmds.createTab(${tabInfo.path})`, result);
      return result;
    },
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
// タブのファイル一覧を表示するため、DirEntry[] 取得

function queryKey_useCmdGetDirEntries(tabId: TabId) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabId, 'getDirEntries'];
}
async function queryFn_getDirEntries(tabId: TabId) {
  const result = await rustcmds.getDirEntries(tabId);
  logResult(`rustcmds.getDirEntries(${tabId})`, result);
  if (result.status === 'ok') {
    // ファイル一覧が取得出来たら、以前のディレクトリでのファイルフォーカス位置を復元する
    useTabStore.getState().restoreDirFocus(tabId, result.data);
  }
  return result;
}
export function useCmdGetDirEntries(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdGetDirEntries(tabInfo.id),
    queryFn: async () => (queryFn_getDirEntries(tabInfo.id)),
    enabled: 0 < tabInfo.id,
    select: data => {
      return select_getDirEntries(data);
    },
  });
}
export function useCmdGetDirEntries_error(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdGetDirEntries(tabInfo.id),
    queryFn: async () => (queryFn_getDirEntries(tabInfo.id)),
    enabled: 0 < tabInfo.id,
    select: data => {
      return select_getDirEntries_error(data);
    },
  });
}
function select_getDirEntries(data: RustCmdResult<DirEntry[]>) {
  if (data.status === 'error') {
    return undefined;
  } else {
    return data.data;
  }
}
function select_getDirEntries_error(data: RustCmdResult<DirEntry[]>) {
  if (data.status === 'error') {
    return data.error;
  } else {
    return undefined
  }
}
export function getQueryData_getDirEntries(tabId: TabId): DirEntry[] | undefined {
  const data = myQueryClient.getQueryData<RustCmdResult<DirEntry[]>>(queryKey_useCmdGetDirEntries(tabId));
  if (!data) return undefined;
  return select_getDirEntries(data);
}
export function getQueryData_getDirEntries_error(tabId: TabId): string | undefined {
  const data = myQueryClient.getQueryData<RustCmdResult<DirEntry[]>>(queryKey_useCmdGetDirEntries(tabId));
  if (!data) return undefined;
  return select_getDirEntries_error(data);
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
// タブ内の個々のファイルを表示するための情報取得

function queryKey_useFileInfosQuery(tabInfo: TabInfo, fileIds: FileId[]) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabInfo.id, 'getFileInfos', fileIds];
}
function queryKey_useFileInfo1Query(tabInfo: TabInfo, fileId: FileId) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabInfo.id, 'getFileInfo', fileId];
}
export function useCmdFileInfosQuery(tabInfo: TabInfo, fileIds: FileId[]) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKey_useFileInfosQuery(tabInfo, fileIds),
    queryFn: async () => {
      const result = await rustcmds.getFileInfos(tabInfo.id, fileIds);
      logResult(`rustcmds.getFileInfos(${tabInfo.id},[${fileIds.length}])`, result);
      return result;
    },
    enabled: 0 < fileIds.length,
    select: data => {
      if (data.status === 'error') {
        // TODO
        return undefined;
      } else {
        // ここで取得したデータは個別に取得するので、キャッシュに格納しておく
        data.data.forEach(fileInfo => {
          queryClient.setQueryData(queryKey_useFileInfo1Query(tabInfo, fileInfo.file_id), fileInfo);
        });
        return undefined; // このhookの戻り値を使用することはないのでデータを返す必要はない
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
export function getQueryData_getFileInfo1(tabInfo: TabInfo, fileId: FileId): FileInfo | undefined {
  return myQueryClient.getQueryData<FileInfo>(queryKey_useFileInfo1Query(tabInfo, fileId));
}
