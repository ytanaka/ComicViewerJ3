import { useTabStore } from "@/store/tab/store";
import { DirEntry, handleRustCmdResult, rustcmds, TabInfo } from "../bindings-wrapper";
import { getQueryData_getDirEntries } from "@/services/tab-dir-entry";
import { dialogCommands } from "./dialog-commands";

function st() {
  return useTabStore.getState();
}

export const fileCommands = {
  async rename() {
    const { tab, sel } = getSelectedFiles();
    if (!tab || !sel) return;
    if (sel.length !== 1) return;

    const name = await dialogCommands.showInputDialog("リネーム", "", sel[0].name);
    if (!name || name === sel[0].name) return;
    const result = await rustcmds.renameFile(tab.id, sel[0].file_id, name);
    handleRustCmdResult(result, `rustcmds.renameFile(${tab.id},${sel[0].file_id},${name})`, '変更できません');
  }
};

function getSelectedFiles(): { tab: TabInfo | undefined, sel: DirEntry[] | undefined } {
  const EMPTY = { tab: undefined, sel: undefined };

  const tab = st().getCurrentTab();
  if (!tab) return EMPTY;

  const sel = tab.selection;
  if (!sel.selectionIndexes.has(sel.focusIndex)) return EMPTY;

  const dirEntries = getQueryData_getDirEntries(tab.info.id);
  if (!dirEntries) return EMPTY;

  const ret: DirEntry[] = [];

  for (const i of sel.selectionIndexes) {
    const e = dirEntries[i];
    if (e) ret.push(e);
  }

  return { tab: tab.info, sel: ret };
}