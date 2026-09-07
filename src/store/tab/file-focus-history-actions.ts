import { StateCreator } from 'zustand';
import { TabStore } from './store';
import { _useTabStore_getImmerTab, MAX_HIST, TabId } from './types';
import { Draft } from 'immer';
import { getQueryData_getDirEntry } from '@/services/files';

export interface FileFocusHistoryActions {
  pushHistory: (tabId: TabId, path: string, filename: string) => void;
  findHistory: (tabId: TabId, path: string) => string | undefined;
}

export const createFileFocusHistoryActions: StateCreator<
  TabStore,
  [['zustand/immer', never]],
  [],
  FileFocusHistoryActions
> = (set, get) => ({
  pushHistory: (tabId: TabId, path: string, filename: string) => {
    set(state => {
      _useTabStore_pushHistory_toImmer(state, tabId, path, filename);
    });
  },

  findHistory: (tabId: TabId, path: string) => {
    return get()
      .getTab(tabId)
      ?.focusHistories?.find(h => h.path === path)?.filename;
  },
});

export function _useTabStore_pushHistory_toImmer(
  state: Draft<TabStore>,
  tabId: TabId,
  path: string,
  filename: string
): boolean {
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

export function _useTabStore_pushHistoryCurrentFile_toImmer(
  state: Draft<TabStore>,
  tabId: TabId,
  fileIndex: number
): boolean {
  const tab = _useTabStore_getImmerTab(state, tabId);
  if (!tab) return false;
  const dirEntry = getQueryData_getDirEntry(tabId, fileIndex);
  if (!dirEntry) return false;
  return _useTabStore_pushHistory_toImmer(state, tabId, tab.info.path, dirEntry.name);
}
