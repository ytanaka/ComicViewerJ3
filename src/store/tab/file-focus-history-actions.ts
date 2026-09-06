import { StateCreator } from 'zustand';
import { TabStore } from './store';
import { _useTabStore_getDirEntries, _useTabStore_getImmerTab, MAX_HIST, TabId } from './types';
import { Draft } from 'immer';

export interface FileFocusHistoryActions {
  pushHistory: (tabId: TabId, path: string, filename: string) => void;
  findHistory: (tabId: TabId, path: string) => string | undefined;
}

export const createFileFocusHistoryActions: StateCreator<
  TabStore,
  [["zustand/immer", never]],
  [],
  FileFocusHistoryActions
> = (set, get) => ({

  pushHistory: (tabId: TabId, path: string, filename: string) => {
    set((state) => {
      _useTabStore_pushHistory_toImmer(state, tabId, path, filename);
    })
  },

  findHistory: (tabId: TabId, path: string) => {
    return get().getTab(tabId)?.focusHistories?.find(h => h.path === path)?.filename;
  },
});

export function _useTabStore_pushHistory_toImmer(state: Draft<TabStore>, tabId: TabId, path: string, filename: string): boolean {
  const tab = _useTabStore_getImmerTab(state, tabId);
  let hist = tab?.focusHistories;
  if (!tab || !hist) return false;
  hist = hist.filter(e => e.path !== path);
  hist.push({ path, filename });
  const max = MAX_HIST;
  if (max < hist.length) {
    hist.splice(0, hist.length - max);
  }
  tab.focusHistories = hist;
  return true;
}

export function _useTabStore_pushHistoryCurrentFile_toImmer(state: Draft<TabStore>, tabId: TabId): boolean {
  const tab = _useTabStore_getImmerTab(state, tabId);
  const dirEntries = _useTabStore_getDirEntries(tabId);
  if (!tab || !dirEntries) return false;
  const focus = tab.selection.focusIndex;
  if (focus < 0 || dirEntries.length <= focus) return false;
  return _useTabStore_pushHistory_toImmer(state, tabId, tab.info.path, dirEntries[focus].name);
}

