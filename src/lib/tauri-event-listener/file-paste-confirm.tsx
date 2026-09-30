import { useEffect } from 'react';

import { useAppConstantsStore } from '@/store/app-constants';
import { FilePasteConfirmEvent } from '../bindings';
import { TauriEventListener } from './util';

const listener = new TauriEventListener(async (event: FilePasteConfirmEvent) => {
  console.log(event);
  // TODO
});

export function TauriFilePasteConfirmEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_file_paste_confirm);

  useEffect(() => {
    if (!EVENT_NAME) return;
    listener.startListen(EVENT_NAME);
    return () => {
      listener.endListen();
    };
  }, [EVENT_NAME]);
  return <></>;
}
