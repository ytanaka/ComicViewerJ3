import { TabStore } from "./store";
import { FileSelection, mkFileSelection, TabId } from "./types";

export interface FileSelectionActions {
  getSelection: (tabId: TabId) => FileSelection;
  setSelection: (tabId: TabId, sel: FileSelection) => void;

  moveFocusNormal: (tabId: TabId, index: number) => void;
  moveFocusOnly: (tabId: TabId, index: number) => void;
  moveFocusWithSelectionArea: (tabId: TabId, index: number) => void;
  toggleSelection: (tabId: TabId, index: number) => void;
  toggleAllSelection: (tabId: TabId) => void;

  isValidFileIndex: (tabId: TabId, index: number) => boolean;
}

export const createFileSelectionActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore,
): FileSelectionActions => ({
  getSelection: (tabId: TabId) => {
    let ret = get().selections[tabId];
    if (ret) return ret;

    ret = mkFileSelection();
    get().setSelection(tabId, ret);

    return ret;
  },
  setSelection: (tabId: TabId, sel: FileSelection) => {
    set(state => ({
      selections: {
        ...state.selections,
        [tabId]: sel
      }
    }))
  },

  // ↑↓で普通にフォーカス移動、マウスクリックでファイル選択
  // Focus, Anchor, Select が変わる
  moveFocusNormal: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    const sel = get().getSelection(tabId);
    sel.focusIndex = index;
    sel.anchorIndex = index;
    sel.selectionIndexes = new Set([index]);
    get().setSelection(tabId, sel);
    get().pushHistoryCurrentFile(tabId);
  },

  // Ctrl + ↑↓でフォーカスだけが移動する
  // Select が変化せずに Focus, Anchor が変わる
  moveFocusOnly: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    const sel = get().getSelection(tabId);
    sel.focusIndex = index;
    sel.anchorIndex = index;
    get().setSelection(tabId, sel);
    get().pushHistoryCurrentFile(tabId);
  },

  // Shift + ↑↓で選択エリアを変更する
  // Anchor が変化せずに Focus, Select が変わる
  moveFocusWithSelectionArea: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    const sel = get().getSelection(tabId);

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
    get().setSelection(tabId, sel);
    get().pushHistoryCurrentFile(tabId);
  },

  // Ctrl + 'Space' でフォーカス一の選択をON/OFF
  toggleSelection: (tabId: TabId, index: number) => {
    if (!get().isValidFileIndex(tabId, index)) return;
    const sel = get().getSelection(tabId);
    if (sel.selectionIndexes.has(index)) {
      sel.selectionIndexes.delete(index);
    } else {
      sel.selectionIndexes.add(index);
    }
    get().setSelection(tabId, sel);
  },

  // Ctrl+A で全選択切替
  toggleAllSelection: (tabId: TabId) => {
    const sel = get().getSelection(tabId);

    const dirEntries = get().getTab(tabId).dirEntries;
    if (!dirEntries) return;
    if (sel.selectionIndexes.size === dirEntries.length) {
      sel.selectionIndexes.clear();
    } else {
      for (let i = 0; i < dirEntries.length; i++) {
        sel.selectionIndexes.add(i);
      }
    }
    get().setSelection(tabId, sel);
  },

  isValidFileIndex: (tabId: TabId, index: number) => {
    const dirEntries = get().getTab(tabId).dirEntries;
    if (!dirEntries) return false;
    return 0 <= index && index <= dirEntries.length - 1;
  },
});
