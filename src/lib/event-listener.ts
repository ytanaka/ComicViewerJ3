import { listen as tauri_listen } from '@tauri-apps/api/event';
import { FileNotifyEvent } from './bindings';
import { getQueryData_getDirEntries, removeQueries_tab, setQueryData_getFileInfo1 } from '@/services/files';
import { FileId, TabId } from '@/store/tab/types';
import { useTabStore } from '@/store/tab/store';
import { handleRustCmdResult, rustcmds } from './bindings-wrapper';

// タブ内ファイルの更新イベントリスナー

const EVENT_ID_FILE_NOTIFY = 'file-notify';

const queue: FileNotifyEvent[] = [];
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

tauri_listen<FileNotifyEvent>(EVENT_ID_FILE_NOTIFY, async event => {
  queue.push(event.payload);
  processQueue();
});

async function handleEvent(event: FileNotifyEvent) {
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
