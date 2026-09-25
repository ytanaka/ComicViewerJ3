import React from 'react';

import { openPath as tauri_openPath } from '@tauri-apps/plugin-opener';
import { join as tauri_join } from '@tauri-apps/api/path';

import { useTabStore } from '@/store/tab/store';
import { searchHelper } from '../commands/search-helper';
import { fileCommands } from '../commands/file-commands';
import { dialogCommands } from '../commands/dialog-commands';
import { DirEntry, TabInfo } from '../bindings-wrapper';
import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { useListScrollHandlerStore } from '@/store/list-scroll-handler-store';
import { searchCommands } from '../commands/search-commands';
import { UiTab } from '@/store/tab/types';
import { isPictureFileExtension } from '../tools/string-util';
import { getUIStore_checkInvokeByOsExt } from '@/store/ui-store';

function st() {
  return useTabStore.getState();
}

// ######################################################################################################################
// キーボード
// ######################################################################################################################
export function tabFiles_handleKeyDown(e: KeyboardEvent): boolean {
  if (dialogCommands.isOpenAnyDialog()) return false;
  const tab = st().getCurrentTab();
  if (!tab) return false;
  const tabInfo = tab.info;

  const sel = tab.selection;
  const focusIndex = sel.focusIndex;
  const dirEntries = getQueryData_getDirEntries(tabInfo.id);
  if (dirEntries === undefined) return false;

  let newIndex: number | null = null;

  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const CTRL_ONLY = C && !S && !A;
  const SHIFT_ONLY = !C && S && !A;
  const NO_MOD = !C && !S && !A;
  const MOD_ONLY = e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt';
  const keyLow = e.key.toLowerCase();

  const colNum = useListScrollHandlerStore.getState().columns;
  const rowNum = useListScrollHandlerStore.getState().rows;

  // console.debug(e);

  // -------------------------------------------------------------------------------------------------------------------
  // ファイル検索
  // -------------------------------------------------------------------------------------------------------------------
  if (!tab.imageViewMode.enable) {
    if (CTRL_ONLY && (keyLow === 'n' || keyLow === 'p')) {
      if (keyLow === 'n') searchCommands.searchNext();
      if (keyLow === 'p') searchCommands.searchPrev();
      e.preventDefault();
      return true;
    }
  }
  // ファイル検索する以外のキーが押されたら、検索キャンセル
  if (!MOD_ONLY) {
    searchHelper.cancel();
  }

  // -------------------------------------------------------------------------------------------------------------------
  // フォーカス移動
  // -------------------------------------------------------------------------------------------------------------------
  if (e.key === 'ArrowDown') {
    newIndex = focusIndex + colNum;
  } else if (e.key === 'ArrowUp') {
    newIndex = focusIndex - colNum;
  } else if (e.key === 'PageDown') {
    newIndex = focusIndex + rowNum * colNum;
  } else if (e.key === 'PageUp') {
    newIndex = focusIndex - rowNum * colNum;
  } else if (e.key === 'ArrowRight') {
    newIndex = focusIndex + 1;
  } else if (e.key === 'ArrowLeft') {
    newIndex = focusIndex - 1;
  } else if (e.key === 'Home') {
    newIndex = 0;
  } else if (e.key === 'End') {
    newIndex = dirEntries.length - 1;
  }
  if (newIndex !== null) {
    // 画像2枚表示時の特別処理
    if (tab.imageViewMode.enable && tab.imageViewMode.dualImage) {
      if (newIndex === focusIndex + 1) {
        newIndex += 1;
      } else if (newIndex === focusIndex - 1) {
        newIndex -= 1;
      }
    }

    let index = newIndex;
    index = Math.min(index, dirEntries.length - 1);
    index = Math.max(index, 0);
    if (NO_MOD) {
      st().moveFocusNormal(tabInfo.id, index as number);
    } else if (CTRL_ONLY) {
      st().moveFocusOnly(tabInfo.id, index as number);
    } else if (SHIFT_ONLY) {
      st().moveFocusWithSelectionArea(tabInfo.id, index as number);
    } else {
      return false;
    }
    const doScroll = useListScrollHandlerStore.getState().doScroll;
    if (doScroll) doScroll(index);

    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 1ファイルの選択ON/OFF
  // -------------------------------------------------------------------------------------------------------------------
  if (CTRL_ONLY && e.key === ' ') {
    st().toggleSelection(tabInfo.id, focusIndex);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 全選択切替
  // -------------------------------------------------------------------------------------------------------------------
  if (CTRL_ONLY && keyLow === 'a') {
    st().toggleAllSelection(tabInfo.id);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // ディレクトリ移動
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === 'Enter') {
    const ent = dirEntries[sel.focusIndex];
    return actionForDirEntry(tab, ent);
  }
  if (NO_MOD && e.key === 'Backspace') {
    fileCommands.moveToParentDir();
    st().setImageView(tabInfo.id, false);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // OSに任せる
  // -------------------------------------------------------------------------------------------------------------------
  if (CTRL_ONLY && e.key === 'Enter') {
    if (sel.selectionIndexes.size === 1 && sel.selectionIndexes.has(focusIndex)) {
      const ent = dirEntries[sel.focusIndex];
      if (ent.is_dir) {
        // ディレクトリの場合
        tauri_join(tab.info.path, ent.name).then(path => {
          tauri_openPath(path);
        });
      } else {
        // ファイルの場合
        dialogCommands.showOkCancelDialog('アプリ起動確認', `${ent.name} を開きますか？`).then(b => {
          if (b) {
            tauri_join(tab.info.path, ent.name).then(path => {
              tauri_openPath(path);
            });
          }
        });
      }
      return true;
    }
  }

  return false;
}

// ######################################################################################################################
// クリック
// ######################################################################################################################

export function tabFiles_handleMouseClick(e: React.MouseEvent, tabInfo: TabInfo, fileIndex: number): boolean {
  const tabId = tabInfo.id;
  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const CTRL = C && !S && !A;
  const SHIFT = !C && S && !A;
  const NO_MOD = !C && !S && !A;

  // ファイル検索検索キャンセル
  searchHelper.cancel();

  if (NO_MOD) {
    st().moveFocusNormal(tabId, fileIndex);
  } else if (CTRL) {
    st().moveFocusOnly(tabId, fileIndex);
    st().toggleSelection(tabId, fileIndex);
  } else if (SHIFT) {
    st().moveFocusWithSelectionArea(tabId, fileIndex);
  } else {
    return false;
  }

  e.preventDefault();
  return true;
}

// ######################################################################################################################
// ダブルクリック
// ######################################################################################################################

export function tabFiles_handleMouseDoubleClick(e: React.MouseEvent, tabInfo: TabInfo, fileIndex: number): boolean {
  const tab = st().getTab(tabInfo.id);
  if (!tab) return false;

  const dirEntries = getQueryData_getDirEntries(tabInfo.id);
  if (dirEntries === undefined) return false;

  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const NO_MOD = !C && !S && !A;

  // ファイル検索検索キャンセル
  searchHelper.cancel();

  if (NO_MOD) {
    if (!actionForDirEntry(tab, dirEntries[fileIndex])) return false;
  }

  e.preventDefault();
  return true;
}

// ######################################################################################################################

function actionForDirEntry(tab: UiTab, ent: DirEntry): boolean {
  if (tab.imageViewMode.enable) return false;

  if (ent.is_dir) {
    fileCommands.moveToChildDirectory(ent);
    return true;
  } else {
    // OSに任せる拡張子
    if (getUIStore_checkInvokeByOsExt(ent.name)) {
      tauri_join(tab.info.path, ent.name).then(path => {
        tauri_openPath(path);
      });
      return true;
    }

    // 画像のデフォルト動作
    if (isPictureFileExtension(ent.name)) {
      st().setImageView(tab.info.id, true);
      return true;
    }
  }
  return false;
}
