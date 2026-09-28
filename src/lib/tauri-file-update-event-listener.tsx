import { useEffect } from 'react';
import { listen as tauri_listen } from '@tauri-apps/api/event';

import { FileUpdateNotifyEvent } from './bindings';
import { FileId, TabId } from '@/store/tab/types';
import { useTabStore } from '@/store/tab/store';
import { handleRustCmdResult, rustcmds } from './bindings-wrapper';
import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { setQueryData_getFileInfo1 } from '@/services/tab-file-info';
import { removeQueries_tab } from '@/services/tab';
import { useAppConstantsStore } from '@/store/app-constants';

// タブ内ファイルの更新イベントリスナー

const queue: FileUpdateNotifyEvent[] = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const event = queue.shift();
    if (event) await handleEvent(event);
  }

  processing = false;
}

let initializing = false;

export function TauriFileUpdateEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_file_updaet_notify);
  useEffect(() => {
    if (!EVENT_NAME) return;
    let unlistenFn: () => void;

    const start = async () => {
      if (initializing) return;
      initializing = true;
      unlistenFn = await tauri_listen<FileUpdateNotifyEvent>(EVENT_NAME, async event => {
        queue.push(event.payload);
        processQueue();
      });
      initializing = false;
      console.info("TauriFileUpdateEventListener: start listen");
    }
    start();

    return () => {
      if (unlistenFn) unlistenFn();
    }
  }, [EVENT_NAME])
  return <></>;
}

async function handleEvent(event: FileUpdateNotifyEvent) {
  const tabId = event.tab_id as TabId;
  const fileId = event.file_id as FileId;

  if (useTabStore.getState().getTab(tabId) === undefined) {
    // 複数ファイルが更新されると連続してイベントが来る。
    // ディレクトリ更新するとタブIDが変わるので、古いイベントを無視する
    return;
  }

  if (fileId !== null) {
    // ファイル指定されたら、そのファイルだけメタデータを再読み込み
    const dirEnt = getQueryData_getDirEntries(tabId)?.find(d => d.file_id === fileId);
    if (dirEnt) {
      const result = await rustcmds.getFileInfos(tabId, [fileId]);
      handleRustCmdResult(
        result,
        `rustcmds.getFileInfos(${tabId}, [${fileId}]) in Event listener`,
        'ファイル情報更新に失敗しました',
        result => {
          setQueryData_getFileInfo1(tabId, fileId, result[0]);
        }
      );
    }
  } else {
    // ファイル指定されなかったら、ディレクトリを再読み込み
    const result = await rustcmds.removeTab(tabId);
    if (
      handleRustCmdResult(result, `rustcmds.removeTab(${tabId}) in Event listener`, 'ファイル一覧更新に失敗しました')
    ) {
      removeQueries_tab(tabId);
      useTabStore.getState().invalidateTabForRefresh(tabId);
    }
  }

  console.log('event listener: ', event);
}
