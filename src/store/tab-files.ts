
import { DirEntry, FileInfo } from '@/lib/bindings';
import { FileFocusHistory } from './file-focus-history';
import { ScrollLevel, useScrollToFocusState } from './scroll-to-focus-state';

// Zustand で管理している TabState の内部で使用するクラス
//
// ※ このクラスの更新メソッドを呼ぶときは、TabState.updateTab(), updateCurrentTab() を使うこと
//    そうしないと、zustand のデータ不整合が発生する
//
// コンポーネントの中では、
//   const updateCurrentTab = useTabState(state => state.updateCurrentTab);
//   updateCurrentTab(tab => {
//     tab.files.setFileInfo(index, data);
//   });
//
// ロジックの中では、
//   useTabState.getState().updateCurrentTab((tab) => {
//     tab.files.clearPath();
//   }

export class TabFiles {
  private path?: string = undefined;
  private errMsg?: string = undefined;

  private dirEntries?: DirEntry[] = undefined;
  private fileInfoList?: FileInfo[] = undefined; // sparse array
  private fileErrorList?: string[] = undefined; // sparse array

  private focusHistory: FileFocusHistory = new FileFocusHistory();

  focusIndex: number = 0; // listが空のときも0
  anchorIndex: number = 0;
  selectionIndexes: Set<number> = new Set();

  constructor() { }

  toDebugString() {
    return `path:${this.path}, dirEntries:[${this.dirEntries?.length}], focus:${this.focusIndex}, sel:${this.selectionIndexes.size}`;
  }

  isInitialized(): boolean {
    return this.dirEntries !== undefined;
  }
  getDirEntries(): DirEntry[] {
    if (this.dirEntries === undefined) throw new ReferenceError('list not initialized');
    return this.dirEntries;
  }

  clearPath() {
    this.path = undefined;
    this.dirEntries = undefined;
    this.fileInfoList = undefined;
  }

  getFocusFileInfo(): FileInfo | undefined {
    return this.getFileInfo(this.focusIndex);
  }
  getFileInfo(index: number): FileInfo | undefined {
    return this.fileInfoList?.[index];
  }
  setFileInfo(index: number, fileInfo: FileInfo) {
    const ent = this.dirEntries?.[index];
    if (!ent) return;
    if (fileInfo.name !== ent.name) {
      console.error(
        `BUG: TabFiles.setFileInfo() path = ${this.path}, dirEntry.name = ${ent.name}, getFileInfo().name = ${fileInfo.name}`
      );
    }
    if (this.fileInfoList) this.fileInfoList[index] = fileInfo;
  }
  getFileError(index: number): string | undefined {
    return this.fileErrorList?.[index];
  }
  setFileError(index: number, msg: string) {
    if (this.fileErrorList) this.fileErrorList[index] = msg;
  }
  setErrMsg(err: string) {
    this.errMsg = err;
  }
  getErrMsg() {
    return this.errMsg;
  }

  getSelectionIndexes() {
    return this.selectionIndexes;
  }

  updateDirEntries(path: string, list: DirEntry[]) {
    // タブ切り替えの時に FileList.tsx から呼ばれるケースを無視する (選択状態がリセットされないように)
    if (list === this.dirEntries) return;

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
        this.focusIndex = 0;
        this.selectionIndexes = list.length === 0 ? new Set() : new Set([this.focusIndex]);
        this.anchorIndex = this.focusIndex;
      }
    }
    this.dirEntries = list;
    this.errMsg = undefined;
    this.fileInfoList = [];
    this.fileErrorList = [];
    useScrollToFocusState.getState().setScroll(ScrollLevel.Lazy); // 親ディレクトリに移動したときにうまくスクロールしないので遅延させる
  }

  pushHistory(dir: string, name: string) {
    this.focusHistory.push(dir, name);
  }

  #updateHistory() {
    if (this.path === undefined || this.dirEntries === undefined || this.dirEntries.length === 0) return;
    this.focusHistory.push(this.path, this.dirEntries[this.focusIndex].name);
  }
  #checkIndex(index: number): DirEntry {
    const ret = this.dirEntries?.[index];
    if (ret === undefined)
      throw RangeError(`index: ${index} is out of array. TabFiles.list.length=${this.dirEntries?.length}`);
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

  // Ctrl + 'Space' でフォーカス一の選択をON/OFF
  toggleSelection(index: number) {
    if (this.selectionIndexes.has(index)) {
      this.selectionIndexes.delete(index);
    } else {
      this.selectionIndexes.add(index);
    }
  }

  // Ctrl+A で全選択切替
  toggleAllSelection() {
    if (!this.dirEntries) return;
    if (this.selectionIndexes.size === this.dirEntries.length) {
      this.selectionIndexes.clear()
    } else {
      for (let i = 0; i < this.dirEntries.length; i++) {
        this.selectionIndexes.add(i);
      }
    }
  }
}
