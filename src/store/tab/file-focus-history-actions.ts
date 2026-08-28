import { TabStore } from "./store";
import { FileFocusHistory, MAX_HIST, TabId } from "./types";

export interface FileFocusHistoryActions {
  getHistory: (tabId: TabId) => FileFocusHistory;
  setHistory: (tabId: TabId, sel: FileFocusHistory) => void;

  pushHistory: (tabId: TabId, path: string, filename: string) => void;
  findHistory: (tabId: TabId, path: string) => string | undefined;

  pushHistoryCurrentFile: (tabId: TabId) => void;
}

export const createFileFocusHistoryActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore,
): FileFocusHistoryActions => ({
  getHistory: (tabId: TabId) => {
    let ret = get().focusHistories[tabId];
    if (ret) return ret;

    ret = { hist: [] };
    get().setHistory(tabId, ret);
    return ret;
  },
  setHistory: (tabId: TabId, hist: FileFocusHistory) => {
    set(state => ({
      focusHistories: {
        ...state.focusHistories,
        [tabId]: hist
      }
    }))
  },

  pushHistory: (tabId: TabId, path: string, filename: string) => {
    let hist = get().getHistory(tabId).hist;
    hist = hist.filter(e => e.path !== path);
    hist.push({ path, filename });
    if (MAX_HIST < hist.length) {
      hist.splice(0, hist.length - MAX_HIST);
    }
    get().setHistory(tabId, { hist });
  },

  findHistory: (tabId: TabId, path: string) => {
    return get().getHistory(tabId).hist.find(h => h.path === path)?.filename
  },

  pushHistoryCurrentFile: (tabId: TabId) => {
    const tab = get().getTab(tabId);
    const name = tab.dirEntries?.[get().getSelection(tabId).focusIndex]?.name
    if (!name) return;
    get().pushHistory(tabId, tab.path, name);
  },
})
