
import { listen as tauri_listen } from '@tauri-apps/api/event';
import { FileNotifyEvent } from './bindings';
import { removeQueries_getFileInfo1, removeQueries_tab } from '@/services/files';
import { FileId, TabId } from '@/store/tab/types';
import { useTabStore } from '@/store/tab/store';
import { handleRustCmdResult, rustcmds } from './bindings-wrapper';

const EVENT_ID_FILE_NOTIFY = "file-notify";

// TODO Channel にする
tauri_listen<FileNotifyEvent>(EVENT_ID_FILE_NOTIFY, async (event) => {
  const data = event.payload;
  if (data.file_id === null) {
    const result = await rustcmds.removeTab(data.tab_id as TabId);
    if (handleRustCmdResult(result, `rustcmds.removeTab(${data.tab_id}) in Event listener`, "ファイル一覧更新に失敗しました")) {
      removeQueries_tab(data.tab_id as TabId);
      useTabStore.getState().invalidateTabForRefresh(data.tab_id as TabId);
    }
  } else {
    removeQueries_getFileInfo1(data.tab_id as TabId, data.file_id as FileId);
  }

  console.log("event listener: ", event);
});
