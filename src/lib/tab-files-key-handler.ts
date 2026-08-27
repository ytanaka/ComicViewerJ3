import { fileCommands } from './commands/file-commands';
import React from 'react';
import { ScrollLevel, useScrollToFocusState } from '@/store/scroll-to-focus-state';
import { TabInfo } from '@/store/tab-info';
import { TabFilesOp } from '@/store/tab-files';

export class TabFilesSelectionKeyHandler {
  tab: TabInfo;
  pageNum: number;

  constructor(tab: TabInfo, pageNum: number) {
    this.tab = tab;
    this.pageNum = pageNum;
  }

  // キーボードによるリストのフォーカス移動ハンドラー
  // フォーカスが移動したら、true
  handleKey(e: KeyboardEvent): boolean {
    const tabFiles = new TabFilesOp(this.tab);
    const focus = tabFiles.data.focusIndex;
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
      newIndex = focus + this.pageNum;
    } else if (e.key === 'PageUp') {
      newIndex = focus - this.pageNum;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabFiles.getDirEntries().length - 1;
    }
    if (newIndex !== null) {
      newIndex = Math.min(newIndex, tabFiles.getDirEntries().length - 1);
      newIndex = Math.max(newIndex, 0);
      if (NO_MOD) {
        tabFiles.moveFocusNormal(newIndex as number);
      } else if (CTRL) {
        tabFiles.moveFocusOnly(newIndex as number);
      } else if (SHIFT) {
        tabFiles.moveFocusWithSelectionArea(newIndex as number);
      }
      useScrollToFocusState.getState().setScroll(ScrollLevel.Normal);
      e.preventDefault();
      return true;
    }

    // 選択ON/OFF
    if (CTRL && e.key === ' ') {
      tabFiles.toggleSelection(focus);
      e.preventDefault();
      return true;
    }

    // 全選択切替
    if (CTRL && e.key === 'a') {
      tabFiles.toggleAllSelection();
      e.preventDefault();
      return true;
    }

    return false;
  }
}

export class TabFilesMouseHandler {
  tab: TabInfo;

  constructor(tab: TabInfo) {
    this.tab = tab;
  }

  handle(index: number, e: React.MouseEvent): boolean {
    const tabFiles = new TabFilesOp(this.tab);
    const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
    const CTRL = C && !S && !A;
    const SHIFT = !C && S && !A;
    const NO_MOD = !C && !S && !A;

    if (NO_MOD) {
      tabFiles.moveFocusNormal(index);
    } else if (CTRL) {
      tabFiles.moveFocusOnly(index);
    } else if (SHIFT) {
      tabFiles.moveFocusWithSelectionArea(index);
    } else {
      return false;
    }

    e.preventDefault();
    return true;
  }
}
export class TabFilesDirWalkerKeyHandler {
  tab: TabInfo;

  constructor(tab: TabInfo) {
    this.tab = tab;
  }
  handleKey(e: KeyboardEvent): boolean {
    const tabFiles = new TabFilesOp(this.tab);

    if (e.key === 'Enter') {
      const info = tabFiles.getFileInfo(tabFiles.data.focusIndex);
      if (!info || !info.metadata?.is_dir) return false;

      fileCommands.moveToChildDirectory(info.name);
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      fileCommands.moveToParentDir();
      e.preventDefault();
    } else {
      return false;
    }

    return true;
  }
}
