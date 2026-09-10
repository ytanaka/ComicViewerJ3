import { useQuery, useQueryClient } from '@tanstack/react-query';

import { DirEntry, FileInfo, handleRustCmdResult, RustCmdResult, rustcmds, TabInfo } from '@/lib/bindings-wrapper';
import { myQueryClient } from '@/lib/query-client';
import { useTabStore } from '@/store/tab/store';
import { FileId, TabId } from '@/store/tab/types';

// タブ関連の queryKey はこれを先頭に入れ、次に TabId を入れる
// タブを消すときはまとめて消す
const HEAD_QUERY_KEY_FOR_TAB_ID = 'tabId=';

function mkTabQueryKey(tabId: TabId) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabId];
}

export function removeQueries_tab(tabId: TabId) {
  myQueryClient.removeQueries({ queryKey: mkTabQueryKey(tabId) });
  const cachedTabIds = getQueryData_tabIds();
  console.debug(`TanStack Query tab cache = [${cachedTabIds}]`);

  // 負数のタブIDは消すタイミングがないので、ここで消しておく
  cachedTabIds
    .filter(tabId => tabId < 0)
    .forEach(tabId => {
      console.debug(`queryClient.removeQueries(${tabId})`);
      myQueryClient.removeQueries({ queryKey: mkTabQueryKey(tabId) });
    });
}

function getQueryData_tabIds() {
  const list = myQueryClient
    .getQueryCache()
    .getAll()
    .filter(q => q.queryKey[0] === HEAD_QUERY_KEY_FOR_TAB_ID)
    .map(q => q.queryKey[1] as TabId);
  return [...new Set(list)];
}

// ---------------------------------------------------------------------------------------------------------------------
// タブ作成
// ※ zustand が localStrage から復元したタブはまだRust側と結び付けられていないので、ここで結び付ける
// ※ 普通のタブ作成は、タブ作成時に TabInfo.id が設定されているのでここでは処理しない
// useQuery() -> useMutate() に変えようとしたら、useTabStore.getState().updateTab() の中で再レンダーされて無限ループになってしまった
function queryKey_useCmdCreateTab(tabInfo: TabInfo) {
  return [...mkTabQueryKey(tabInfo.id), 'createTab'];
}

export function useCmdCreateTab(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdCreateTab(tabInfo),
    queryFn: async () => {
      const result = await rustcmds.createTab(tabInfo.path);
      handleRustCmdResult(result, `rustcmds.createTab(${tabInfo.path})`, 'タブ初期化失敗', data => {
        useTabStore.getState().updateTab(tabInfo.id, data);
      });
      return null;
    },
    enabled: tabInfo.id < 0,
    gcTime: 0,
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// タブのファイル一覧を表示するため、DirEntry[] 取得

function queryKey_useCmdGetDirEntries(tabId: TabId) {
  return [...mkTabQueryKey(tabId), 'getDirEntries'];
}
async function queryFn_getDirEntries(tabId: TabId) {
  const result = await rustcmds.getDirEntries(tabId);
  handleRustCmdResult(result, `rustcmds.getDirEntries(${tabId})`, 'ファイル名一覧取得失敗', data => {
    // ファイル一覧が取得出来たら、以前のディレクトリでのファイルフォーカス位置を復元する
    useTabStore.getState().restoreDirFocus(tabId, data);
  });
  return result;
}
export function useCmdGetDirEntries(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdGetDirEntries(tabInfo.id),
    queryFn: async () => queryFn_getDirEntries(tabInfo.id),
    enabled: 0 < tabInfo.id,
    select: data => {
      return select_getDirEntries(data);
    },
  });
}
export function useCmdGetDirEntries_error(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdGetDirEntries(tabInfo.id),
    queryFn: async () => queryFn_getDirEntries(tabInfo.id),
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
    return undefined;
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
  return [...mkTabQueryKey(tabInfo.id), 'getFileInfos', fileIds];
}
function queryKey_useFileInfo1Query(tabId: TabId, fileId: FileId) {
  return [...mkTabQueryKey(tabId), 'getFileInfo1', fileId];
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
        'ファイル情報取得失敗'
      );
      return result;
    },
    enabled: 0 < tabInfo.id && 0 < fileIds.length,
    select: data => {
      if (data.status === 'ok') {
        // ここで取得したデータは個別に取得するので、キャッシュに格納しておく
        data.data.forEach(fileInfo => {
          queryClient.setQueryData(queryKey_useFileInfo1Query(tabInfo.id, fileInfo.file_id), fileInfo);
        });
      }
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
