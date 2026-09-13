import { useQuery } from '@tanstack/react-query';

import { DirEntry, handleRustCmdResult, RustCmdResult, rustcmds, TabInfo } from '@/lib/bindings-wrapper';
import { myQueryClient } from '@/lib/query-client';
import { useTabStore } from '@/store/tab/store';
import { TabId } from '@/store/tab/types';
import { queryKey_tabId } from './tab';

// ---------------------------------------------------------------------------------------------------------------------
// タブのファイル一覧を表示するため、DirEntry[] 取得

function queryKey_useCmdGetDirEntries(tabId: TabId) {
  return [...queryKey_tabId(tabId), 'getDirEntries'];
}
export function useCmdGetDirEntries(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdGetDirEntries(tabInfo.id),
    queryFn: async () => {
      const result = await rustcmds.getDirEntries(tabInfo.id);
      handleRustCmdResult(result, `rustcmds.getDirEntries(${tabInfo.id})`, 'ファイル名一覧取得失敗', data => {
        // ファイル一覧が取得出来たら、以前のディレクトリでのファイルフォーカス位置を復元する
        useTabStore.getState().restoreDirFocus(tabInfo.id, data);
      });
      return result;
    },
    enabled: 0 < tabInfo.id,
    select: data => {
      return select_getDirEntries(data);
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
