import { useTabState } from "@/store/tab-state";

export class ListFilesSelectionKeyHandler {
  pageNum: number;

  constructor(pageNum: number) {
    this.pageNum = pageNum;
  }

  // キーボードによるリストのフォーカス移動ハンドラー
  // フォーカスが移動したら、true
  handleKey(e: KeyboardEvent): boolean {
    let newIndex = null;
    const list = useTabState.getState().getCurrentTab()?.list;
    if (!list) return false;
    const focus = list.focusIndex;

    if (e.key === "ArrowDown") {
      newIndex = focus + 1;
    } else if (e.key === "ArrowUp") {
      newIndex = focus - 1;
    } else if (e.key === "PageDown") {
      newIndex = focus + this.pageNum;
    } else if (e.key === "PageUp") {
      newIndex = focus - this.pageNum;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = list.getDirEntries().length - 1;
    }

    if (newIndex !== null) {
      newIndex = Math.min(newIndex, list.getDirEntries().length - 1);
      newIndex = Math.max(newIndex, 0);
      list.moveFocusNormal(newIndex);
      e.preventDefault();
      return true;
    }

    return false;
  }
}

// export class ListFilesDirWalkerKeyHandler {
//   handleKey(e: KeyboardEvent): boolean {
//     const tab = useTabState.getState().getCurrentTab();
//     const list = tab?.list;
//     if (!list) return false;
//     const focus = list.focusIndex;
//     const files = list.getDirEntries();
//     if (files.length === 0) return false;


//     return false;
//   }

// }
