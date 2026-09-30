import { useEffect } from 'react';

import { useAppConstantsStore } from '@/store/app-constants';
import { FilePasteConfirmEvent } from '../bindings';
import { TauriEventListener } from './util';
import { dialogCommands } from '../commands/dialog-commands';
import { rustcmds, TaskId } from '../bindings-wrapper';

const listener = new TauriEventListener(async (event: FilePasteConfirmEvent) => {
  const res = await dialogCommands.showFilePasteConfirmDialog(event)
  await rustcmds.respondToTask(event.task_id as TaskId, res);
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
