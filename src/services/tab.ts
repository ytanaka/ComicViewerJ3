import { useQuery } from '@tanstack/react-query';

import { handleRustCmdCreateTabResult, rustcmds, TabInfo } from '@/lib/bindings-wrapper';
import { myQueryClient } from '@/lib/query-client';
import { useTabStore } from '@/store/tab/store';
import { TabId } from '@/store/tab/types';

// タブ関連の queryKey はこれを先頭に入れ、次に TabId を入れる
// タブを消すときはまとめて消す
const HEAD_QUERY_KEY_FOR_TAB_ID = 'tabId=';

export function queryKey_tabId(tabId: TabId) {
  return [HEAD_QUERY_KEY_FOR_TAB_ID, tabId];
}

export function removeQueries_tab(tabId: TabId) {
  myQueryClient.removeQueries({ queryKey: queryKey_tabId(tabId) });
  const cachedTabIds = getQueryData_tabIds();
  console.debug(`TanStack Query tab cache = [${cachedTabIds}]`);

  // 負数のタブIDは消すタイミングがないので、ここで消しておく
  cachedTabIds
    .filter(tabId => tabId < 0)
    .forEach(tabId => {
      console.debug(`queryClient.removeQueries(${tabId})`);
      myQueryClient.removeQueries({ queryKey: queryKey_tabId(tabId) });
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
  return [...queryKey_tabId(tabInfo.id), 'createTab'];
}

export function useCmdCreateTab(tabInfo: TabInfo) {
  return useQuery({
    queryKey: queryKey_useCmdCreateTab(tabInfo),
    queryFn: async () => {
      const result = await rustcmds.createTab(tabInfo.path);
      handleRustCmdCreateTabResult(result, `rustcmds.createTab(${tabInfo.path})`, 'タブ初期化失敗', data => {
        useTabStore.getState().updateTab(tabInfo.id, data);
      });
      return null;
    },
    enabled: tabInfo.id < 0,
    gcTime: 0,
  });
}
