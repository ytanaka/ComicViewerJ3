import { useTabStore } from '@/store/tab/store';
import { rustcmds, SortType_type } from '../bindings-wrapper';
import { toast } from 'sonner';

export const sortCommands = {
  async sortFiles(type: SortType_type) {
    const tab = useTabStore.getState().getCurrentTab();
    const cond = { ...tab.sortCondition };
    if (cond.sort_type.type === type) {
      cond.asc = !cond.asc;
    } else {
      cond.sort_type = { type: type };
      cond.asc = true;
    }

    const result = await rustcmds.sortFiles(tab.id, cond);
    if (result.status === 'error') {
      toast.error(`${result.error}`);
      console.error(`rustcmds.sortFiles(${tab.id}) error ${result.error}`);
    } else if (!result.data) {
      toast.warning('このディレクトリではまだソートの準備ができていません');
    } else {
      useTabStore.getState().setSortCondition(tab.id, cond);
    }
  },
};
