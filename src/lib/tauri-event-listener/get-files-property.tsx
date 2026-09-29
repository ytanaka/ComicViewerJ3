import { useEffect } from 'react';
import { listen as tauri_listen } from '@tauri-apps/api/event';

import { useAppConstantsStore } from '@/store/app-constants';
import { usePrepareFileOperationStore } from '@/store/prepare-file-operation-store';
import { GetFilesPropertyNotifyEvent } from '../bindings';

let initializing = false;

export function TauriGetFilesPropertyEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_get_files_property);
  const setNotifyEvent = usePrepareFileOperationStore(state => state.setNotifyEvent);

  useEffect(() => {
    if (!EVENT_NAME) return;
    let unlistenFn: () => void;

    const start = async () => {
      if (initializing) return;
      initializing = true;
      unlistenFn = await tauri_listen<GetFilesPropertyNotifyEvent>(EVENT_NAME, async event => {
        console.debug('TauriGetFilesPropertyEventListener: receive event:', event);
        setNotifyEvent(event.payload);
      });
      initializing = false;
      console.info('TauriGetFilesPropertyEventListener: start listen');
    };
    start();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [EVENT_NAME, setNotifyEvent]);
  return <></>;
}
