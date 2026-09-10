import { useTabStore } from '@/store/tab/store';
import { handleRustCmdResult, rustcmds, SortType_type } from '../bindings-wrapper';
import { toast } from 'sonner';
import { DelayedToast } from '../delayed-toast';

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

    const t = new DelayedToast(100, () => toast('ソート中', { id: 'sorting' }));
    try {
      const result = await rustcmds.sortFiles(tab.info.id, cond);
      handleRustCmdResult(result, `rustcmds.sortFiles(${tab.info.id},${cond})`, 'ファイル名ソート失敗', data => {
        if (!data) {
          toast.error('このディレクトリではまだソートの準備ができていません', { id: 'sort-not-yet-ready' });
        } else {
          useTabStore.getState().setSortCondition(tab.info.id, cond);
        }
      });
    } finally {
      t.dismiss();
    }
  },
};
