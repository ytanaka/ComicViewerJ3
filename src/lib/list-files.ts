import { DirEntry } from './bindings';
import { FileFocusHistory } from './file-focus-history';

export class ListFiles {
  private path?: string = undefined;
  private list?: DirEntry[] = undefined;

  private focusHistory: FileFocusHistory = new FileFocusHistory();

  focusIndex: number = 0; // listが空のときも0
  anchorIndex: number = 0;
  selectionIndexes: Set<number> = new Set();

  constructor() { }

  isInitialized(): boolean {
    return this.list !== undefined
  }
  dirEntries(): DirEntry[] {
    if (this.list === undefined) throw new ReferenceError("list not initialized");
    return this.list;
  }


  clearPath() {
    this.path = undefined;
    this.list = undefined;
  }

  updateDirEntries(path: string, list: DirEntry[]) {
    // 以前のフォーカス状態をなるべく保持する
    this.path = path;
    const prevName: string | undefined = this.focusHistory.find(path);
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
        this.selectionIndexes = new Set();
        this.anchorIndex = this.focusIndex;
      }
    }
    this.list = list;
  }

  #updateHistory() {
    if (this.path === undefined || this.list === undefined || this.list.length === 0) return;
    this.focusHistory.push(this.path, this.list[this.focusIndex].name);
  }
  #checkIndex(index: number): DirEntry {
    const ret = this.list?.[index];
    if (ret === undefined)
      throw RangeError(`index: ${index} is out of array. ListFiles.list.length=${this.list?.length}`);
    return ret;
  }

  // ↑↓で普通にフォーカス移動、マウスクリックでファイル選択
  // Focus, Anchor, Select が変わる
  moveFocusNormal(index: number) {
    this.#checkIndex(index);
    this.focusIndex = index;
    this.anchorIndex = index;
    this.selectionIndexes = new Set([index]);
    this.#updateHistory();
  }

  // Ctrl + ↑↓でフォーカスだけが移動する
  // Select が変化せずに Focus, Anchor が変わる
  moveFocusOnly(index: number) {
    this.#checkIndex(index);
    this.focusIndex = index;
    this.anchorIndex = index;
    this.#updateHistory();
  }

  // Shift + ↑↓で選択エリアを変更する
  // Anchor が変化せずに Focus, Select が変わる
  moveFocusWithSelectionArea(index: number) {
    this.#checkIndex(index);
    this.focusIndex = index;

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
    this.#updateHistory();
  }
}
