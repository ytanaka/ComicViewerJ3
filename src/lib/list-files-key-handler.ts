import { ListFiles } from "./list-files";

export class ListFilesKeyHandler {
    list: ListFiles;
    pageNum: number;

    constructor(list: ListFiles, pageNum: number) {
        this.list = list;
        this.pageNum = pageNum;
    }

    // キーボードによるリストのフォーカス移動ハンドラー
    // フォーカスが移動したら、true
    handleKey(e: KeyboardEvent): boolean {
        let newIndex = null;
        const focus = this.list.focusIndex;

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
            newIndex = this.list.dirEntries().length - 1;
        }

        if (newIndex !== null) {
            newIndex = Math.min(newIndex, this.list.dirEntries().length - 1);
            newIndex = Math.max(newIndex, 0);
            this.list.moveFocusNormal(newIndex);
            e.preventDefault();
            return true;
        }

        return false;
    }
}
