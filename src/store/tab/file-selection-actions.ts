import { StateCreator } from 'zustand';
import { TabStore } from './store';
import { _useTabStore_getDirEntries, _useTabStore_setExistTabFields, FileSelection, TabId } from './types';
import { _useTabStore_pushHistoryCurrentFile_toImmer } from './file-focus-history-actions';

export interface FileSelectionActions {
  getSelection: (tabId: TabId) => FileSelection | undefined;
  setSelection: (tabId: TabId, sel: FileSelection) => void;

  moveFocusNormal: (tabId: TabId, index: number) => void;
  moveFocusOnly: (tabId: TabId, index: number) => void;
  moveFocusWithSelectionArea: (tabId: TabId, index: number) => void;
  toggleSelection: (tabId: TabId, index: number) => void;
  toggleAllSelection: (tabId: TabId) => void;

  isValidFileIndex: (tabId: TabId, index: number) => boolean;
}

export const createFileSelectionActions: StateCreator<
  TabStore,
  [["zustand/immer", never]],
  [],
  FileSelectionActions
> = (set, get) => ({
  getSelection: (tabId: TabId) => {
    return get().getTab(tabId)?.selection;
  },
  setSelection: (tabId: TabId, sel: FileSelection) => {
    set(state => {
      _useTabStore_setExistTabFields(state, tabId, (tab) => {
        tab.selection = sel;
      });
    });
  },

  // ↑↓で普通にフォーカス移動、マウスクリックでファイル選択
  // Focus, Anchor, Select が変わる
  moveFocusNormal: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set((state) => {
      _useTabStore_setExistTabFields(state, tabId, (tab) => {
        const sel = tab.selection;
        sel.focusIndex = index;
        sel.anchorIndex = index;
        sel.selectionIndexes = new Set([index]);
      });
      _useTabStore_pushHistoryCurrentFile_toImmer(state, tabId);
    })
  },

  // Ctrl + ↑↓でフォーカスだけが移動する
  // Select が変化せずに Focus, Anchor が変わる
  moveFocusOnly: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set((state) => {
      _useTabStore_setExistTabFields(state, tabId, (tab) => {
        const sel = tab.selection;
        sel.focusIndex = index;
        sel.anchorIndex = index;
      });
      _useTabStore_pushHistoryCurrentFile_toImmer(state, tabId);
    })
  },

  // Shift + ↑↓で選択エリアを変更する
  // Anchor が変化せずに Focus, Select が変わる
  moveFocusWithSelectionArea: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set((state) => {
      _useTabStore_setExistTabFields(state, tabId, (tab) => {
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
      _useTabStore_pushHistoryCurrentFile_toImmer(state, tabId);
    })

  },

  // Ctrl + 'Space' でフォーカス一の選択をON/OFF
  toggleSelection: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    set((state) => {
      _useTabStore_setExistTabFields(state, tabId, (tab) => {
        const sel = tab.selection;
        if (sel.selectionIndexes.has(index)) {
          sel.selectionIndexes.delete(index);
        } else {
          sel.selectionIndexes.add(index);
        }
      });
      _useTabStore_pushHistoryCurrentFile_toImmer(state, tabId);
    })
  },

  // Ctrl+A で全選択切替
  toggleAllSelection: (tabId: TabId) => {
    const dirEntries = _useTabStore_getDirEntries(tabId);
    if (!dirEntries) return;
    set((state) => {
      _useTabStore_setExistTabFields(state, tabId, (tab) => {
        const sel = tab.selection;
        if (sel.selectionIndexes.size === dirEntries.length) {
          sel.selectionIndexes.clear();
        } else {
          for (let i = 0; i < dirEntries.length; i++) {
            sel.selectionIndexes.add(i);
          }
        }
      });
    })
  },

  isValidFileIndex: (tabId: TabId, index: number) => {
    const dirEntries = _useTabStore_getDirEntries(tabId);
    if (!dirEntries) return false;
    return 0 <= index && index <= dirEntries.length - 1;
  },
});
