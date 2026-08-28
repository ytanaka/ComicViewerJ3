import { fileCommands } from './commands/file-commands';
import React from 'react';
import { ScrollLevel, useScrollToFocusState } from '@/store/scroll-to-focus-state';
import { TabInfo } from '@/store/tab/types';
import { useTabStore } from '@/store/tab/store';

function st() { return useTabStore.getState(); }

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
    const sel = st().getSelection(this.tab.id);
    const focus = sel.focusIndex;
    const dirEntries = this.tab.dirEntries;
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
      newIndex = focus + this.pageNum;
    } else if (e.key === 'PageUp') {
      newIndex = focus - this.pageNum;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = dirEntries.length - 1;
    }
    if (newIndex !== null) {
      newIndex = Math.min(newIndex, dirEntries.length - 1);
      newIndex = Math.max(newIndex, 0);
      if (NO_MOD) {
        st().moveFocusNormal(this.tab.id, newIndex as number);
      } else if (CTRL) {
        st().moveFocusOnly(this.tab.id, newIndex as number);
      } else if (SHIFT) {
        st().moveFocusWithSelectionArea(this.tab.id, newIndex as number);
      }
      useScrollToFocusState.getState().setScroll(ScrollLevel.Normal);
      e.preventDefault();
      return true;
    }

    // 選択ON/OFF
    if (CTRL && e.key === ' ') {
      st().toggleSelection(this.tab.id, focus);
      e.preventDefault();
      return true;
    }

    // 全選択切替
    if (CTRL && e.key === 'a') {
      st().toggleAllSelection(this.tab.id);
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

  handle(fileIndex: number, e: React.MouseEvent): boolean {
    const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
    const CTRL = C && !S && !A;
    const SHIFT = !C && S && !A;
    const NO_MOD = !C && !S && !A;

    if (NO_MOD) {
      st().moveFocusNormal(this.tab.id, fileIndex);
    } else if (CTRL) {
      st().moveFocusOnly(this.tab.id, fileIndex);
    } else if (SHIFT) {
      st().moveFocusWithSelectionArea(this.tab.id, fileIndex);
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
    if (e.key === 'Enter') {
      const sel = st().getSelection(this.tab.id);
      const info = st().getFileInfo(this.tab.id, sel.focusIndex);
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
