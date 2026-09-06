import { useTabStore } from '@/store/tab/store';
import { logResult, rustcmds, SortType_type } from '../bindings-wrapper';
import { toast } from 'sonner';
import { removeQueries_getDirEntries } from '@/services/files';

export const sortCommands = {
  async sortFiles(type: SortType_type) {
    const tab = useTabStore.getState().getCurrentTab();
    if (!tab) return;
    const cond = { ...tab.sortCondition };
    if (cond.sort_type.type === type) {
      cond.asc = !cond.asc;
    } else {
      cond.sort_type = { type: type };
      cond.asc = true;
    }

    const result = await rustcmds.sortFiles(tab.info.id, cond);
    logResult(`rustcmds.sortFiles(${tab.info.id},${cond})`, result);
    if (result.status === 'error') {
      // TODO
      toast.error(`${result.error}`);
    } else if (!result.data) {
      toast.warning('このディレクトリではまだソートの準備ができていません');
    } else {
      removeQueries_getDirEntries(tab.info.id);
      useTabStore.getState().setSortCondition(tab.info.id, cond);
    }
  },
};
