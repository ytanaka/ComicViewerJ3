import { useTabStore } from '@/store/tab/store';
import {
  DirEntry,
  getNextTaskId,
  handleRustCmdFileOpResult,
  handleRustCmdResult,
  rustcmds,
  TabInfo,
} from '../bindings-wrapper';
import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { dialogCommands } from './dialog-commands';
import { usePrepareFileOperationStore } from '@/store/prepare-file-operation-store';

function st() {
  return useTabStore.getState();
}

export const fileCommands = {
  async createFile() {
    const { tab } = getSelectedFiles();
    if (!tab) return;

    const name = await dialogCommands.showInputDialog('新規ファイル作成', '', '新規ファイル.txt');
    if (!name) return;
    const result = await rustcmds.createFile(tab.id, name);
    handleRustCmdFileOpResult(result, `rustcmds.createFile(${tab.id},${name})`, '作成できません', () => {
      st().pushHistory(tab.id, tab.path, name);
    });
  },

  async createDirectory() {
    const { tab } = getSelectedFiles();
    if (!tab) return;

    const name = await dialogCommands.showInputDialog('新規ディレクトリ作成', '', '');
    if (!name) return;
    const result = await rustcmds.createDirectory(tab.id, name);
    handleRustCmdFileOpResult(result, `rustcmds.createDirectory(${tab.id},${name})`, '作成できません', () => {
      st().pushHistory(tab.id, tab.path, name);
    });
  },

  async delete() {
    const { tab, sel } = getSelectedFiles();
    if (!tab || !sel) return;
    if (sel.length === 0) return;

    // ダイアログを表示して、削除対象を検査する
    const taskId = getNextTaskId();
    const dialogResult = dialogCommands.showPrepareDeleteDialog(tab, sel, taskId);
    const result = await rustcmds.getFilesProperty(tab.id, sel.map(ent => ent.file_id), taskId);
    handleRustCmdResult(result, `rustcmds.getFilesProperty(${tab.id}, [${sel[0].file_id}])`, 'ファイル情報取得失敗');
    if (result.status === 'error') {
      return;
    }

    // キャンセルされた
    if (!(await dialogResult)) {
      const event = usePrepareFileOperationStore.getState().event;
      if (event?.finished !== true) {
        // 計算途中で閉じられたら、タスクをキャンセルする
        await rustcmds.cancelTask(taskId);
      }
      return;
    }






  },

  async rename() {
    const { tab, sel } = getSelectedFiles();
    if (!tab || !sel) return;
    if (sel.length !== 1) return;

    const name = await dialogCommands.showInputDialog('名前変更', '', sel[0].name);
    if (!name || name === sel[0].name) return;
    const result = await rustcmds.renameFile(tab.id, sel[0].file_id, name);
    handleRustCmdFileOpResult(
      result,
      `rustcmds.renameFile(${tab.id},${sel[0].file_id},${name})`,
      '変更できません',
      () => {
        st().pushHistory(tab.id, tab.path, name);
      }
    );
  },

  async fileProperty() {
    const { tab, sel } = getSelectedFiles();
    if (!tab || !sel) return;
    if (sel.length !== 1) return;

    // ダイアログを表示して、対象を検査する
    const taskId = getNextTaskId();
    const dialogResult = dialogCommands.showFilePropertyDialog(tab, sel[0], taskId);
    const result = await rustcmds.getFilesProperty(tab.id, [sel[0].file_id], taskId);
    handleRustCmdResult(result, `rustcmds.getFilesProperty(${tab.id}, [${sel[0].file_id}])`, 'ファイル情報取得失敗');

    // ダイアログが閉じるのを待つ
    await dialogResult;
    const event = usePrepareFileOperationStore.getState().event;
    if (event?.finished !== true) {
      // 計算途中で閉じられたら、タスクをキャンセルする
      await rustcmds.cancelTask(taskId);
    }
  },
};

function getSelectedFiles(): { tab: TabInfo | undefined; sel: DirEntry[] | undefined } {
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
