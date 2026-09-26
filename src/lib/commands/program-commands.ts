import { openPath as tauri_openPath } from '@tauri-apps/plugin-opener';
import { join as tauri_join } from '@tauri-apps/api/path';

import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { useTabStore } from '@/store/tab/store';
import { dialogCommands } from './dialog-commands';
import { DirEntry, handleRustCmdResult, rustcmds, TabInfo } from '../bindings-wrapper';
import { useExternalProgramStore } from '@/store/external-program-store';

function st() {
  return useTabStore.getState();
}

export const programCommands = {
  async invokeCurrentFile(confirm: boolean): Promise<boolean> {
    const { tab, files } = getCurrentDirFiles();
    if (!tab || !files) return false;

    if (files.length === 1) {
      await this.invoke(tab, files[0], confirm);
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

    const { tab, files } = getCurrentDirFiles();
    if (!tab || !files) return;
    if (0 < p.maxSelectionLimit) {
      while (p.maxSelectionLimit < files.length) {
        files.pop();
      }
    }

    const cmd = p.command.split('\n');
    if (cmd.length <= 0) return;

    const prog = cmd[0];
    const args: string[] = [];
    for (const s of cmd.slice(1)) {
      if (s === '${files}') {
        for (const f of files) {
          args.push(await tauri_join(tab.path, f.name));
        }
      } else if (s === '${dir}') {
        args.push(tab.path);
      } else {
        args.push(s);
      }
    }

    async function invokeFn() {
      const result = await rustcmds.invokeProgram(prog, args);
      handleRustCmdResult(result, `rustcmds.invokeProgram()`, `(${p.name})起動`);
    }

    if (p.debugPrompt) {
      dialogCommands.showOkCancelDialog(`${p.name}`, `${prog}\n${args.join('\n')}`).then(async b => {
        if (b) {
          await invokeFn();
        }
      });
    } else {
      await invokeFn();
    }
  },
};

function getCurrentDirFiles(): { tab?: TabInfo; files?: DirEntry[] } {
  const tab = st().getCurrentTab();
  if (!tab) return {};

  const sel = tab.selection;
  const focusIndex = sel.focusIndex;
  if (!sel.selectionIndexes.has(focusIndex)) return {};

  const dirEntries = getQueryData_getDirEntries(tab.info.id);
  if (dirEntries === undefined) return {};

  const files: DirEntry[] = [];
  sel.selectionIndexes.forEach(i => {
    const ent = dirEntries[i];
    if (ent) files.push(ent);
  });
  return { tab: tab.info, files };
}
