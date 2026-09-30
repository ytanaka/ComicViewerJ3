import { useEffect } from 'react';

import { useAppConstantsStore } from '@/store/app-constants';
import { usePrepareFileOperationStore } from '@/store/tauri-event/prepare-file-operation-store';
import { GetFilesPropertyNotifyEvent } from '../bindings';
import { TauriEventListener } from './util';

const listener = new TauriEventListener(async (event: GetFilesPropertyNotifyEvent) => {
  const setNotifyEvent = usePrepareFileOperationStore.getState().setNotifyEvent;
  setNotifyEvent(event);
});

export function TauriGetFilesPropertyEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_get_files_property);

  useEffect(() => {
    if (!EVENT_NAME) return;
    listener.startListen(EVENT_NAME);
    return () => {
      listener.endListen();
    };
  }, [EVENT_NAME]);
  return <></>;
}
