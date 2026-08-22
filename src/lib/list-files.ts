import { DirEntry } from './bindings';

export class ListFiles {
  list?: DirEntry[] = undefined;

  focusIndex: number = 0; //
  focusName?: string = undefined;
  anchorIndex: number = 0;
  selectionIndexes: Set<number> = new Set();

  constructor() {}

  updateDirEntries(list: DirEntry[]) {
    // 以前のフォーカス状態をなるべく保持する
    const prevName: string | undefined = this.list?.[this.focusIndex]?.name;
    const newName: string | undefined = list[this.focusIndex]?.name;
    if (!!prevName && prevName === newName) {
      // 新しいリストの同じ位置に同じ名前がある
      this.selectionIndexes = new Set([this.focusIndex]);
      this.anchorIndex = this.focusIndex;
    } else {
      const find = list.findIndex(f => f.name === prevName);
      if (0 <= find) {
        // フォーカスしていたファイルが別の位置に移動した
        this.focusIndex = find;
        this.selectionIndexes = new Set([this.focusIndex]);
        this.anchorIndex = this.focusIndex;
      } else {
        // フォーカスしていたファイルがなくなった
        this.focusIndex = Math.max(0, Math.min(this.focusIndex, list.length - 1));
        this.focusName = list[this.focusIndex]?.name;
        this.selectionIndexes = new Set();
        this.anchorIndex = this.focusIndex;
      }
    }
    this.list = list;
  }

  get(index: number): DirEntry {
    const ret = this.list?.[index];
    if (ret === undefined)
      throw RangeError(`index: ${index} is out of array. ListFiles.list.length=${this.list?.length}`);
    return ret;
  }

  // ↑↓で普通にフォーカス移動、マウスクリックでファイル選択
  // Focus, Anchor, Select が変わる
  moveFocusNormal(index: number) {
    const sel = this.get(index);
    this.focusIndex = index;
    this.focusName = sel.name;
    this.anchorIndex = index;
    this.selectionIndexes = new Set([index]);
  }

  // Ctrl + ↑↓でフォーカスだけが移動する
  // Select が変化せずに Focus, Anchor が変わる
  moveFocusOnly(index: number) {
    const sel = this.get(index);
    this.focusIndex = index;
    this.focusName = sel.name;
    this.anchorIndex = index;
  }

  // Shift + ↑↓で選択エリアを変更する
  // Anchor が変化せずに Focus, Select が変わる
  moveFocusWithSelectionArea(index: number) {
    const sel = this.get(index);
    this.focusIndex = index;
    this.focusName = sel.name;

    // 選択状態は、anchor -> focus まで
    this.selectionIndexes.clear();
    let from = this.anchorIndex;
    let to = this.focusIndex;
    if (to < from) {
      from = this.focusIndex;
      to = this.anchorIndex;
    }
    for (let i = from; i <= to; i++) {
      this.selectionIndexes.add(i);
    }
  }
}
