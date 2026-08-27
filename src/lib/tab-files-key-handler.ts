import { useTabState } from '@/store/tab-state';
import { fileCommands } from './commands/file-commands';
import React from 'react';
import { ScrollLevel, useScrollToFocusState } from '@/store/scroll-to-focus-state';

export class TabFilesSelectionKeyHandler {
  pageNum: number;

  constructor(pageNum: number) {
    this.pageNum = pageNum;
  }

  // キーボードによるリストのフォーカス移動ハンドラー
  // フォーカスが移動したら、true
  handleKey(e: KeyboardEvent): boolean {
    let newIndex: number | null = null;
    const tab = useTabState.getState().getCurrentTab();
    const focus = tab.files.focusIndex;

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
      newIndex = tab.files.getDirEntries().length - 1;
    }
    if (newIndex !== null) {
      newIndex = Math.min(newIndex, tab.files.getDirEntries().length - 1);
      newIndex = Math.max(newIndex, 0);
      useTabState.getState().updateCurrentTab(tab => {
        if (NO_MOD) {
          tab.files.moveFocusNormal(newIndex as number);
        } else if (CTRL) {
          tab.files.moveFocusOnly(newIndex as number);
        } else if (SHIFT) {
          tab.files.moveFocusWithSelectionArea(newIndex as number);
        }
      });
      useScrollToFocusState.getState().setScroll(ScrollLevel.Normal);
      e.preventDefault();
      return true;
    }

    // 選択ON/OFF
    if (CTRL && e.key === ' ') {
      useTabState.getState().updateCurrentTab(tab => {
        tab.files.toggleSelection(focus);
      });
      e.preventDefault();
      return true;
    }

    // 全選択切替
    if (CTRL && e.key === 'a') {
      useTabState.getState().updateCurrentTab(tab => {
        tab.files.toggleAllSelection();
      });
      e.preventDefault();
      return true;
    }

    return false;
  }
}

export class TabFilesMouseHandler {
  handle(index: number, e: React.MouseEvent): boolean {
    const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
    const CTRL = C && !S && !A;
    const SHIFT = !C && S && !A;
    const NO_MOD = !C && !S && !A;

    useTabState.getState().updateCurrentTab(tab => {
      if (NO_MOD) {
        tab.files.moveFocusNormal(index);
      } else if (CTRL) {
        tab.files.moveFocusOnly(index);
      } else if (SHIFT) {
        tab.files.moveFocusWithSelectionArea(index);
      }
      e.preventDefault();
      return true;
    });

    return false;
  }
}
export class TabFilesDirWalkerKeyHandler {
  handleKey(e: KeyboardEvent): boolean {
    const tab = useTabState.getState().getCurrentTab();

    if (e.key === 'Enter') {
      const info = tab.files.getFocusFileInfo();
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
