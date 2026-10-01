import { useEffect } from 'react';

import { useAppConstantsStore } from '@/store/app-constants';
import { TauriEventListener } from './util';
import { dialogCommands } from '../commands/dialog-commands';
import { rustcmds, TaskId } from '../bindings-wrapper';
import { TaskConfirm, TaskResponse } from '../bindings';

const listener = new TauriEventListener(async (event: TaskConfirm) => {
  let res: TaskResponse;
  if (event.t == 'Paste') {
    res = await dialogCommands.showFilePasteConfirmDialog(event);
  } else if (event.t == 'OkCancel') {
    const ret = await dialogCommands.showOkCancelDialog(event.args[0], event.args[1]);
    res = { t: 'OkCancel', task_id: event.task_id, args: ['' + ret] };
  } else {
    res = { t: 'Dummy', task_id: event.task_id, args: [] };
  }
  await rustcmds.respondToTask(event.task_id as TaskId, res);
});

export function TauriTaskConfirmEventListener() {
  const EVENT_NAME = useAppConstantsStore(state => state.val?.event_name_task_confirm);

  useEffect(() => {
    if (!EVENT_NAME) return;
    listener.startListen(EVENT_NAME);
    return () => {
      listener.endListen();
    };
  }, [EVENT_NAME]);
  return <></>;
}
