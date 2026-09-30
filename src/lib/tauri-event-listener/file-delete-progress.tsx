import { useEffect } from 'react';

import { useAppConstantsStore } from '@/store/app-constants';
import { RemoveFilesNotifyEvent } from '../bindings';
import { useFileDeleteProgressStore } from '@/store/tauri-event/file-delete-progress-store';
import { TauriEventListener } from './util';

const listener = new TauriEventListener(async (event: RemoveFilesNotifyEvent) => {
  const setNotifyEvent = useFileDeleteProgressStore.getState().setNotifyEvent;
  setNotifyEvent(event);
});

export function TauriFileDeleteProgressEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_file_delete_progress);

  useEffect(() => {
    if (!EVENT_NAME) return;
    listener.startListen(EVENT_NAME);
    return () => {
      listener.endListen();
    };
  }, [EVENT_NAME]);
  return <></>;
}
