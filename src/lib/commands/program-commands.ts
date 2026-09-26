import { openPath as tauri_openPath } from '@tauri-apps/plugin-opener';
import { join as tauri_join } from '@tauri-apps/api/path';

import { getQueryData_getDirEntries } from "@/services/tab-dir-entry";
import { useTabStore } from "@/store/tab/store";
import { dialogCommands } from './dialog-commands';
import { DirEntry, TabInfo } from '../bindings-wrapper';
import { useExternalProgramStore } from '@/store/external-program-store';

function st() {
  return useTabStore.getState();
}

export const programCommands = {
  async invokeCurrentFile(confirm: boolean): Promise<boolean> {
    const tab = st().getCurrentTab();
    if (!tab) return false;
    const tabInfo = tab.info;

    const sel = tab.selection;
    const focusIndex = sel.focusIndex;
    const dirEntries = getQueryData_getDirEntries(tabInfo.id);
    if (dirEntries === undefined) return false;

    if (sel.selectionIndexes.size === 1 && sel.selectionIndexes.has(focusIndex)) {
      const ent = dirEntries[sel.focusIndex];
      await this.invoke(tab.info, ent, confirm);
      return true;
    }
    return false;
  },

  async invoke(tab: TabInfo, ent: DirEntry, confirm: boolean) {
    async function invokeFn() {
      tauri_join(tab.path, ent.name).then(path => {
        tauri_openPath(path);
      });
    }

    if (ent.is_dir || !confirm) {
      await invokeFn();
    } else {
      dialogCommands.showOkCancelDialog('アプリ起動確認', `${ent.name} を開きますか？`).then(async b => {
        if (b) {
          await invokeFn();
        }
      });
    }
  },

  async startProgram(index: number) {
    const p = useExternalProgramStore.getState().list[index];
    if (!p) return;

    // p.
  }
}
