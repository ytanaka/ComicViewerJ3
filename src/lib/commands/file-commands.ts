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
import { usePrepareFileOperationStore } from '@/store/tauri-event/prepare-file-operation-store';
import { useFileDeleteProgressStore } from '@/store/tauri-event/file-delete-progress-store';
import { MoveOrCopy } from '../bindings';
import { useFilePasteProgressStore } from '@/store/tauri-event/file-paste-progress-store';

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
    const fileIds = sel.map(ent => ent.file_id);

    // ダイアログを表示して、削除対象を検査する
    {
      const taskId = getNextTaskId();
      const dialogResult = dialogCommands.showPrepareDeleteDialog(tab, sel, taskId);
      const result = await rustcmds.getFilesProperty(tab.id, fileIds, taskId);
      handleRustCmdResult(
        result,
        `rustcmds.getFilesProperty(${tab.id}, [len=${fileIds.length}], ${taskId})`,
        'ファイル情報取得失敗'
      );
      if (result.status === 'error') {
        return;
      }

      // 検査中にキャンセルされた
      const lastEvent = usePrepareFileOperationStore.getState().event;
      if (!(await dialogResult) || lastEvent?.head.finished !== true) {
        await rustcmds.cancelTask(taskId);
        return;
      }
    }

    // 削除実行
    {
      const prepareEvent = usePrepareFileOperationStore.getState().event;
      if (!prepareEvent) return;
      const taskId = getNextTaskId();
      const dialogResult = dialogCommands.showDeleteProgressDialog(tab, sel, taskId, prepareEvent);
      const result = await rustcmds.removeFiles(tab.id, fileIds, taskId);
      handleRustCmdResult(
        result,
        `rustcmds.removeFiles(${tab.id}, [len=${fileIds.length}], ${taskId})`,
        'ファイル削除失敗'
      );

      // ダイアログが閉じるのを待つ
      await dialogResult;

      // 削除中にキャンセルされた
      const lastEvent = useFileDeleteProgressStore.getState().event;
      if (!(await dialogResult) || lastEvent?.head.finished !== true) {
        await rustcmds.cancelTask(taskId);
      }
    }
  },
  async moveToClipboard() {
    await fileCommands.moveOrCopyToClipboard({ type: 'Move' });
  },
  async copyToClipboard() {
    await fileCommands.moveOrCopyToClipboard({ type: 'Copy' });
  },
  async moveOrCopyToClipboard(mode: MoveOrCopy) {
    const { tab, sel } = getSelectedFiles();
    if (!tab || !sel) return;
    if (sel.length === 0) return;
    const fileIds = sel.map(ent => ent.file_id);

    const result = await rustcmds.fileCutOrCopyToClipboard(mode, tab.id, fileIds);
    handleRustCmdResult(
      result,
      `rustcmds.fileCutToClipboard(${mode.type}, ${tab.id}, [len=${fileIds.length}])`,
      `ファイル${mode.type}`
    );
  },

  async pasteFromClipboard() {
    const { tab } = getSelectedFiles();
    if (!tab) return;

    const taskId = getNextTaskId();

    // 途中経過ダイアログを表示してからペースト開始
    // ※ 先に表示しておかないと、Rustから重複ファイルの確認が先に来てしまうから
    const dialogResponse = dialogCommands.showPasteProgresDialog(tab, taskId, false);
    const result = await rustcmds.filePasteFromClipboard(taskId, tab.id);
    let isCopy: boolean | null = null;
    handleRustCmdResult(result, `rustcmds.filePasteFromClipboard(${tab.id})`, 'ファイル貼り付け', async data => {
      switch (data.type) {
        case 'NoFiles':
          break;
        case 'InvalidPath':
          await dialogCommands.showOkCancelDialog('不正なパスです', data.path);
          break;
        case 'ProgressCopy':
          isCopy = true;
          break;
        case 'ProgressMove':
          isCopy = false;
          break;
      }
    });
    if (isCopy === null) {
      // ペーストしなかったら、ダイアログを閉じる
      dialogCommands.closePasteProgresDialog();
      return;
    }

    // ダイアログが閉じるのを待つ
    await dialogResponse;

    const lastEvent = useFilePasteProgressStore.getState().event;
    if (!dialogResponse || lastEvent?.head.finished !== true) {
      await rustcmds.cancelTask(taskId);
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
    handleRustCmdResult(
      result,
      `rustcmds.getFilesProperty(${tab.id}, [${sel[0].file_id}], ${taskId})`,
      'ファイル情報取得失敗'
    );

    // ダイアログが閉じるのを待つ
    await dialogResult;
    const event = usePrepareFileOperationStore.getState().event;
    if (event?.head.finished !== true) {
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
