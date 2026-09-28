import { useEffect } from 'react';
import { listen as tauri_listen } from '@tauri-apps/api/event';

import { GetFilesPropertyNotifyEvent } from './bindings';
import { useAppConstantsStore } from '@/store/app-constants';

export function TauriGetFilesPropertyEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_get_files_property);
  useEffect(() => {
    if (!EVENT_NAME) return;
    let unlistenFn: () => void;

    const start = async () => {
      unlistenFn = await tauri_listen<GetFilesPropertyNotifyEvent>(EVENT_NAME, async event => {
        console.log("EVENT", event);
      });
      console.info("TauriGetFilesPropertyEventListener: start listen");
    }
    start();

    return () => {
      if (unlistenFn) unlistenFn();
    }
  }, [EVENT_NAME])
  return <></>;
}
