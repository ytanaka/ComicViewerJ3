import React from 'react';
import { VirtuosoHandle } from 'react-virtuoso';

import { TabInfo } from '@/store/tab/types';
import { useTabStore } from '@/store/tab/store';
import { useSearchTextStore } from '@/store/file-search-text-store';
import { searchCommands } from '../commands/search-commands';
import { fileCommands } from '../commands/file-commands';
import { dialogCommands } from '../commands/dialog-commands';

function st() {
  return useTabStore.getState();
}

export function tabFiles_handleKeyDown(
  e: KeyboardEvent,
  tab: TabInfo,
  pageNum: number,
  virtuoso: VirtuosoHandle
): boolean {
  if (dialogCommands.isOpenAnyDialog()) return false;

  // キーボードによるリストのフォーカス移動ハンドラー
  // フォーカスが移動したら、true
  const sel = st().getSelection(tab.id);
  const focusIndex = sel.focusIndex;
  const dirEntries = tab.dirEntries;
  if (dirEntries === undefined) return false;

  let newIndex: number | null = null;

  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const CTRL_ONLY = C && !S && !A;
  const SHIFT_ONLY = !C && S && !A;
  const NO_MOD = !C && !S && !A;
  const MOD_ONLY = e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt';
  const keyLow = e.key.toLowerCase();

  // -------------------------------------------------------------------------------------------------------------------
  // ファイル検索
  // -------------------------------------------------------------------------------------------------------------------
  if (CTRL_ONLY && (keyLow === 'n' || keyLow === 'p')) {
    const romaji = useSearchTextStore.getState().text;
    if (romaji.length === 0) return false;

    const reverse = keyLow === 'p';
    let startIndex = reverse ? focusIndex - 1 : focusIndex + 1;
    if (dirEntries.length <= startIndex) startIndex = 0;
    if (startIndex < 0) startIndex = dirEntries.length - 1;
    searchCommands.searchNextFilename(tab, startIndex, romaji, reverse, virtuoso);
    e.preventDefault();
    return true;
  }
  // ファイル検索する以外のキーが押されたら、検索キャンセル
  if (!MOD_ONLY) {
    searchCommands.cancel();
  }

  // console.debug(e);

  // -------------------------------------------------------------------------------------------------------------------
  // フォーカス移動
  // -------------------------------------------------------------------------------------------------------------------
  if (e.key === 'ArrowDown') {
    newIndex = focusIndex + 1;
  } else if (e.key === 'ArrowUp') {
    newIndex = focusIndex - 1;
  } else if (e.key === 'PageDown') {
    newIndex = focusIndex + pageNum;
  } else if (e.key === 'PageUp') {
    newIndex = focusIndex - pageNum;
  } else if (e.key === 'Home') {
    newIndex = 0;
  } else if (e.key === 'End') {
    newIndex = dirEntries.length - 1;
  }
  if (newIndex !== null) {
    let index = newIndex;
    index = Math.min(index, dirEntries.length - 1);
    index = Math.max(index, 0);
    if (NO_MOD) {
      st().moveFocusNormal(tab.id, index as number);
    } else if (CTRL_ONLY) {
      st().moveFocusOnly(tab.id, index as number);
    } else if (SHIFT_ONLY) {
      st().moveFocusWithSelectionArea(tab.id, index as number);
    }
    e.preventDefault();
    // ヘッダーがあるので +1 する (※ 先頭行にうまくスクロールできないので、強制的に 0 にする)
    virtuoso.scrollIntoView({ index: index === 0 ? 0 : index + 1 });

    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 1ファイルの選択ON/OFF
  // -------------------------------------------------------------------------------------------------------------------
  if (CTRL_ONLY && e.key === ' ') {
    st().toggleSelection(tab.id, focusIndex);
    e.preventDefault();
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 全選択切替
  // -------------------------------------------------------------------------------------------------------------------
  if (CTRL_ONLY && keyLow === 'a') {
    st().toggleAllSelection(tab.id);
    e.preventDefault();
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // ディレクトリ移動
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === 'Enter') {
    const sel = st().getSelection(tab.id);
    const info = st().getFileInfo(tab.id, sel.focusIndex);
    if (!info || !info.metadata?.is_dir) return false;

    fileCommands.moveToChildDirectory(info.name);
    e.preventDefault();
    return true;
  }
  if (NO_MOD && e.key === 'Backspace') {
    fileCommands.moveToParentDir();
    e.preventDefault();
    return true;
  }

  return false;
}

export function tabFiles_handleMouseClick(e: React.MouseEvent, tab: TabInfo, fileIndex: number): boolean {
  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const CTRL = C && !S && !A;
  const SHIFT = !C && S && !A;
  const NO_MOD = !C && !S && !A;

  // ファイル検索検索キャンセル
  searchCommands.cancel();

  if (NO_MOD) {
    st().moveFocusNormal(tab.id, fileIndex);
  } else if (CTRL) {
    st().moveFocusOnly(tab.id, fileIndex);
    st().toggleSelection(tab.id, fileIndex);
  } else if (SHIFT) {
    st().moveFocusWithSelectionArea(tab.id, fileIndex);
  } else {
    return false;
  }

  e.preventDefault();
  return true;
}
