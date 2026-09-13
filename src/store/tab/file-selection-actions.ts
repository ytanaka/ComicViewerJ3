import { StateCreator } from 'zustand';
import { TabStore } from './store';
import { _useTabStore_setExistTabFields, mkFileSelection, TabId } from './types';
import { _useTabStore_pushHistoryCurrentFile_toImmer } from './file-focus-history-actions';
import { useScrollToFocusStore } from '../scroll-to-focus-store';
import { DirEntry } from '@/lib/bindings-wrapper';
import { getQueryData_getDirEntries, getQueryData_getDirEntry } from '@/services/tab-dir-entry';

export interface FileSelectionActions {
  restoreDirFocus: (tabId: TabId, dirEntries: DirEntry[]) => void;

  moveFocusNormal: (tabId: TabId, index: number) => void;
  moveFocusOnly: (tabId: TabId, index: number) => void;
  moveFocusWithSelectionArea: (tabId: TabId, index: number) => void;
  toggleSelection: (tabId: TabId, index: number) => void;
  toggleAllSelection: (tabId: TabId) => void;

  isValidFileIndex: (tabId: TabId, index: number) => boolean;
}

export const createFileSelectionActions: StateCreator<
  TabStore,
  [['zustand/immer', never]],
  [],
  FileSelectionActions
> = (set, get) => ({
  // DirEntry[] を読み込んだ後、以前のファイルフォーカス位置を復元する
  restoreDirFocus: (tabId: TabId, dirEntries: DirEntry[]) => {
    const tab = get().getTab(tabId);
    if (!tab) return;
    const name = get().findHistory(tabId, tab.info.path);
    const sel = mkFileSelection();
    const find = dirEntries.findIndex(f => f.name === name);
    if (0 <= find) {
      // フォーカスしていたファイルが見つかった
      sel.focusIndex = find;
      sel.selectionIndexes = new Set([sel.focusIndex]);
      sel.anchorIndex = sel.focusIndex;
    } else {
      // フォーカスしていたファイルがなくなった
      sel.focusIndex = 0;
      sel.selectionIndexes = dirEntries.length === 0 ? new Set() : new Set([sel.focusIndex]);
      sel.anchorIndex = sel.focusIndex;
    }

    set(state => {
      _useTabStore_setExistTabFields(state, tabId, tab => {
        tab.selection = sel;
      });
    });

    useScrollToFocusStore.getState().setScroll(true);
  },

  // ↑↓で普通にフォーカス移動、マウスクリックでファイル選択
  // Focus, Anchor, Select が変わる
  moveFocusNormal: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set(state => {
      _useTabStore_setExistTabFields(state, tabId, tab => {
        const sel = tab.selection;
        sel.focusIndex = index;
        sel.anchorIndex = index;
        sel.selectionIndexes = new Set([index]);
      });
      _useTabStore_pushHistoryCurrentFile_toImmer(state, tabId, index);
    });
  },

  // Ctrl + ↑↓でフォーカスだけが移動する
  // Select が変化せずに Focus, Anchor が変わる
  moveFocusOnly: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set(state => {
      _useTabStore_setExistTabFields(state, tabId, tab => {
        const sel = tab.selection;
        sel.focusIndex = index;
        sel.anchorIndex = index;
      });
      _useTabStore_pushHistoryCurrentFile_toImmer(state, tabId, index);
    });
  },

  // Shift + ↑↓で選択エリアを変更する
  // Anchor が変化せずに Focus, Select が変わる
  moveFocusWithSelectionArea: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set(state => {
      _useTabStore_setExistTabFields(state, tabId, tab => {
        const sel = tab.selection;
        sel.focusIndex = index;

        // 選択状態は、anchor -> focus まで
        sel.selectionIndexes.clear();
        let from = sel.anchorIndex;
        let to = sel.focusIndex;
        if (to < from) {
          from = sel.focusIndex;
          to = sel.anchorIndex;
        }
        for (let i = from; i <= to; i++) {
          sel.selectionIndexes.add(i);
        }
      });
      _useTabStore_pushHistoryCurrentFile_toImmer(state, tabId, index);
    });
  },

  // Ctrl + 'Space' でフォーカス一の選択をON/OFF
  toggleSelection: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set(state => {
      _useTabStore_setExistTabFields(state, tabId, tab => {
        const sel = tab.selection;
        if (sel.selectionIndexes.has(index)) {
          sel.selectionIndexes.delete(index);
        } else {
          sel.selectionIndexes.add(index);
        }
      });
    });
  },

  // Ctrl+A で全選択切替
  toggleAllSelection: (tabId: TabId) => {
    const dirEntries = getQueryData_getDirEntries(tabId);
    if (!dirEntries) return;
    set(state => {
      _useTabStore_setExistTabFields(state, tabId, tab => {
        const sel = tab.selection;
        if (sel.selectionIndexes.size === dirEntries.length) {
          sel.selectionIndexes.clear();
        } else {
          for (let i = 0; i < dirEntries.length; i++) {
            sel.selectionIndexes.add(i);
          }
        }
      });
    });
  },

  isValidFileIndex: (tabId: TabId, index: number) => {
    return getQueryData_getDirEntry(tabId, index) !== undefined;
  },
});
