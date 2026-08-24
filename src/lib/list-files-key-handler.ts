import { useTabState } from "@/store/tab-state";
import { fileCommands } from "./commands/file-commands";

export class ListFilesSelectionKeyHandler {
  pageNum: number;

  constructor(pageNum: number) {
    this.pageNum = pageNum;
  }

  // キーボードによるリストのフォーカス移動ハンドラー
  // フォーカスが移動したら、true
  handleKey(e: KeyboardEvent): boolean {
    let newIndex: number | null = null;
    const tab = useTabState.getState().getCurrentTab();
    const focus = tab.list.focusIndex;

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
      newIndex = tab.list.getDirEntries().length - 1;
    }

    if (newIndex !== null) {
      newIndex = Math.min(newIndex, tab.list.getDirEntries().length - 1);
      newIndex = Math.max(newIndex, 0);
      useTabState.getState().updateCurrentTab((tab) => {
        tab.list.moveFocusNormal(newIndex as number);
      });
      e.preventDefault();
      return true;
    }

    return false;
  }
}

export class ListFilesDirWalkerKeyHandler {
  handleKey(e: KeyboardEvent): boolean {
    const tab = useTabState.getState().getCurrentTab();

    if (e.key === "Enter") {
      const info = tab.list.getFocusFileInfo();
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
