import { useMemo } from "react";
import { useTabState } from "./tab-state";
import { TabInfo } from "./tab-info";
import { assert_same_ref } from "@/lib/utils";

const MAX_HIST = 10;

export interface FileFocusHistory {
  histNum: number;

  // 先頭が古いデータ
  hist: HistElm[];
}
interface HistElm {
  path: string;
  focusName: string;
}

export function createFileFocusHistory(n: number = MAX_HIST): FileFocusHistory {
  return {
    histNum: n,
    hist: []
  }
}

export const useFileFocusHistoryOp = () => {
  const tab = useTabState(state => state.getCurrentTab());
  return useMemo(() => {
    return new FileFocusHistoryOp(tab);
  }, [tab]);
}
export const mkFileFocusHistoryOp = () => {
  const tab = useTabState.getState().getCurrentTab();
  return new FileFocusHistoryOp(tab);
}

export class FileFocusHistoryOp {
  private tab: TabInfo;
  private d: FileFocusHistory;

  constructor(data: TabInfo) {
    if (!data) throw new Error('invalid data');
    this.tab = data;
    this.d = data.files.focusHistory;
  }
  push(path: string, focusName: string) {
    useTabState.getState().updateTab(this.tab.id, (tab) => {
      assert_same_ref(tab, this.tab);

      this.d.hist = this.d.hist.filter(e => e.path !== path);
      this.d.hist.push({ path, focusName });
      if (this.d.histNum < this.d.hist.length) {
        this.d.hist.splice(0, this.d.hist.length - this.d.histNum);
      }
    });
  }

  find(path: string): string | undefined {
    return this.d.hist.find(h => h.path === path)?.focusName;
  }
}

