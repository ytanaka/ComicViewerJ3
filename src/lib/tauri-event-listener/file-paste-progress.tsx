import { useEffect } from 'react';

import { useAppConstantsStore } from '@/store/app-constants';
import { FilePasteNotifyEvent } from '../bindings';
import { TauriEventListener } from './util';
import { useFilePasteProgressStore } from '@/store/tauri-event/file-paste-progress-store';

const listener = new TauriEventListener(async (event: FilePasteNotifyEvent) => {
  const setNotifyEvent = useFilePasteProgressStore.getState().setNotifyEvent;
  setNotifyEvent(event);
});

export function TauriFilePasteProgressEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_file_paste_progress_notify);

  useEffect(() => {
    if (!EVENT_NAME) return;
    listener.startListen(EVENT_NAME);
    return () => {
      listener.endListen();
    };
  }, [EVENT_NAME]);
  return <></>;
}
