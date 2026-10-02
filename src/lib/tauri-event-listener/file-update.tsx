import { useEffect } from 'react';

import { FileUpdateNotifyEvent } from '../bindings';
import { useTabStore } from '@/store/tab/store';
import { FileId, handleRustCmdResult, rustcmds, TabId } from '../bindings-wrapper';
import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { setQueryData_getFileInfo1 } from '@/services/tab-file-info';
import { removeQueries_tab } from '@/services/tab';
import { useAppConstantsStore } from '@/store/app-constants';
import { TauriEventListener } from './util-listener';
import { EventAggregator } from './util-aggregator';

// タブ内ファイルの更新イベントリスナー
async function handleEvent(event: FileUpdateNotifyEvent) {
  console.info(`TauriFileUpdateEventListener: receive event: `, event);

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
}

function canIgnoreEvent(pendingEvent: FileUpdateNotifyEvent, arriveEvent: FileUpdateNotifyEvent) {
  // ファイルコピーすると、一時をファイル作成、書き込み、リネームなどで8回イベントが来る
  // しかも、タブ直下に大量のファイルがコピーされると、そのたびにイベントが来る。
  // それらのイベントには file_id == null のタブ再表示イベントが含まれる
  // pending event が file_id == null なら、新規到着イベントはすべて無視できる

  // タブIDが違うイベントは無視できない
  if (pendingEvent.tab_id !== arriveEvent.tab_id) return false;

  // 無視できるイベント
  if (pendingEvent.file_id === null) return true;
  if (pendingEvent.file_id === arriveEvent.file_id) return true;

  return false;
}

const aggregator = new EventAggregator<FileUpdateNotifyEvent>(500, handleEvent, canIgnoreEvent);

const listener = new TauriEventListener<FileUpdateNotifyEvent>(
  async ev => {
    aggregator.emit(ev);
  },
  {
    noLogEvent: true,
  }
);

export function TauriFileUpdateEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_file_updaet);

  useEffect(() => {
    if (!EVENT_NAME) return;
    listener.startListen(EVENT_NAME);
    return () => {
      listener.endListen();
    };
  }, [EVENT_NAME]);
  return <></>;
}
