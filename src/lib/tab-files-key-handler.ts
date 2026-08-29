import { fileCommands } from './commands/file-commands';
import React from 'react';
import { TabInfo } from '@/store/tab/types';
import { useTabStore } from '@/store/tab/store';
import { VirtuosoHandle } from 'react-virtuoso';

function st() {
  return useTabStore.getState();
}

export function tabFiles_handleKey(
  e: KeyboardEvent,
  tab: TabInfo,
  pageNum: number,
  virtuoso: VirtuosoHandle | null
): boolean {
  // キーボードによるリストのフォーカス移動ハンドラー
  // フォーカスが移動したら、true
  const sel = st().getSelection(tab.id);
  const focus = sel.focusIndex;
  const dirEntries = tab.dirEntries;
  if (dirEntries === undefined) return false;

  let newIndex: number | null = null;

  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const CTRL = C && !S && !A;
  const SHIFT = !C && S && !A;
  const NO_MOD = !C && !S && !A;

  // フォーカス移動
  if (e.key === 'ArrowDown') {
    newIndex = focus + 1;
  } else if (e.key === 'ArrowUp') {
    newIndex = focus - 1;
  } else if (e.key === 'PageDown') {
    newIndex = focus + pageNum;
  } else if (e.key === 'PageUp') {
    newIndex = focus - pageNum;
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
    } else if (CTRL) {
      st().moveFocusOnly(tab.id, index as number);
    } else if (SHIFT) {
      st().moveFocusWithSelectionArea(tab.id, index as number);
    }
    e.preventDefault();
    if (virtuoso) {
      // ヘッダーがあるので +1 する (※ 先頭行にうまくスクロールできないので、強制的に 0 にする)
      virtuoso.scrollIntoView({ index: index === 0 ? 0 : index + 1 });
    }
    return true;
  }

  // 選択ON/OFF
  if (CTRL && e.key === ' ') {
    st().toggleSelection(tab.id, focus);
    e.preventDefault();
    return true;
  }

  // 全選択切替
  if (CTRL && e.key === 'a') {
    st().toggleAllSelection(tab.id);
    e.preventDefault();
    return true;
  }

  // ディレクトリ移動
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

export function tabFiles_handleMouse(e: React.MouseEvent, tab: TabInfo, fileIndex: number): boolean {
  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const CTRL = C && !S && !A;
  const SHIFT = !C && S && !A;
  const NO_MOD = !C && !S && !A;

  if (NO_MOD) {
    st().moveFocusNormal(tab.id, fileIndex);
  } else if (CTRL) {
    st().moveFocusOnly(tab.id, fileIndex);
  } else if (SHIFT) {
    st().moveFocusWithSelectionArea(tab.id, fileIndex);
  } else {
    return false;
  }

  e.preventDefault();
  return true;
}
