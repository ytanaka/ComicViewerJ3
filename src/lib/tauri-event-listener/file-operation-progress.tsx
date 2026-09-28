import { useEffect } from 'react';
import { listen as tauri_listen } from '@tauri-apps/api/event';

import { useAppConstantsStore } from '@/store/app-constants';
import { GetFilesPropertyNotifyEvent } from '../bindings';
import { useFileDeleteProgressStore } from '@/store/file-delete-progress-store';

let initializing = false;

export function TauriFileDeleteProgressEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_file_delete_progress);
  const setNotifyEvent = useFileDeleteProgressStore(state => state.setNotifyEvent);

  useEffect(() => {
    if (!EVENT_NAME) return;
    let unlistenFn: () => void;

    const start = async () => {
      if (initializing) return;
      initializing = true;
      unlistenFn = await tauri_listen<GetFilesPropertyNotifyEvent>(EVENT_NAME, async event => {
        setNotifyEvent(event.payload);
      });
      initializing = false;
      console.info('TauriFileDeleteProgressEventListener: start listen');
    };
    start();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [EVENT_NAME, setNotifyEvent]);
  return <></>;
}
