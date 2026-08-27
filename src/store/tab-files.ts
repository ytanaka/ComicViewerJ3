import { DirEntry, FileInfo } from '@/lib/bindings';
import { createFileFocusHistory, FileFocusHistory, FileFocusHistoryOp } from './file-focus-history';
import { ScrollLevel, useScrollToFocusState } from './scroll-to-focus-state';
import { getPathBasename } from '@/lib/string-util';
import { useTabState } from './tab-state';
import { useMemo } from 'react';
import { TabInfo } from './tab-info';
import { assert_same_ref, ExecExclusibe } from '@/lib/utils';

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
export interface TabFiles {
  path: string;
  errMsg?: string;

  dirEntries?: DirEntry[];
  fileInfoList: FileInfo[]; // sparse array
  fileErrorList: string[]; // sparse array
  execExclusive: ExecExclusibe; // FileInfo を取得中フラグ

  focusHistory: FileFocusHistory;

  focusIndex: number; // listが空のときも0
  anchorIndex: number;
  selectionIndexes: Set<number>;
}
export function caeateTabFiles(path: string): TabFiles {
  return {
    path: path, // localstrage に保存される

    fileInfoList: [],
    fileErrorList: [],
    execExclusive: new ExecExclusibe(),

    focusHistory: createFileFocusHistory(), // localstrage に保存される

    focusIndex: 0,
    anchorIndex: 0,
    selectionIndexes: new Set(),
  }
}

export const useTabFilesOp = () => {
  const tab = useTabState(state => state.getCurrentTab)();
  return useMemo(() => {
    return new TabFilesOp(tab);
  }, [tab])
}

export const mkTabFilesOp = () => {
  const tab = useTabState.getState().getCurrentTab();
  return new TabFilesOp(tab);
}

export class TabFilesOp {
  private tab: TabInfo;
  private d: TabFiles;

  constructor(tab: TabInfo) {
    if (!tab) throw new Error('invalid data');
    this.tab = tab;
    this.d = tab.files;
  }

  get data() {
    return this.d;
  }

  // この関数は TabState の onRehydrateStorage から呼ばれる
  init_except_path() {
    this.d.errMsg = undefined;
    this.d.dirEntries = undefined;
    this.d.focusHistory = createFileFocusHistory();
    this.d.fileInfoList = [];
    this.d.fileErrorList = [];
    this.d.execExclusive = new ExecExclusibe();
    this.d.selectionIndexes = new Set();
  }

  isInitialized(): boolean {
    return this.d.dirEntries !== undefined;
  }

  toDebugString() {
    return `path:.../${getPathBasename(this.d.path)}, dirEntries:[${this.d.dirEntries?.length}], focus:${this.d.focusIndex}, sel:${this.d.selectionIndexes.size}`;
  }

  #checkIndex(index: number): DirEntry {
    const ret = this.d.dirEntries?.[index];
    if (ret === undefined)
      throw RangeError(`index: ${index} is out of array. TabFiles.list.length=${this.d.dirEntries?.length}`);
    return ret;
  }
  #updateCurrentTab(fn: () => void) {
    useTabState.getState().updateCurrentTab(tab => {
      assert_same_ref(tab, this.tab);
      fn();
    })
  }
  #focusHistoryOp(): FileFocusHistoryOp {
    return new FileFocusHistoryOp(this.tab)
  }

  setNewPath(path: string) {
    this.#updateCurrentTab(() => {
      this.d.path = path;
      this.init_except_path();
    })
  }

  getPath() {
    if (!this.d) console.log("in getPath() ", this.d);
    return this.d.path;
  }

  getDirEntries(): DirEntry[] {
    if (this.d.dirEntries === undefined) throw new ReferenceError('list not initialized');
    return this.d.dirEntries;
  }

  updateDirEntries(list: DirEntry[]) {
    // ※ このメソッドは TabInfo の updateCurrentTab() の中から呼ばれるので、updateCurrentTab は必要ない

    // 以前のフォーカス状態をなるべく保持する
    const prevName: string | undefined = this.#focusHistoryOp().find(this.d.path);
    const newName: string | undefined = list[this.d.focusIndex]?.name;
    if (!!prevName && prevName === newName) {
      // 新しいリストの同じ位置に同じ名前がある
      this.d.selectionIndexes = new Set([this.d.focusIndex]);
      this.d.anchorIndex = this.d.focusIndex;
    } else {
      const find = list.findIndex(f => f.name === prevName);
      if (0 <= find) {
        // フォーカスしていたファイルが別の位置に移動した
        this.d.focusIndex = find;
        this.d.selectionIndexes = new Set([this.d.focusIndex]);
        this.d.anchorIndex = this.d.focusIndex;
      } else {
        // フォーカスしていたファイルがなくなった
        this.d.focusIndex = 0;
        this.d.selectionIndexes = list.length === 0 ? new Set() : new Set([this.d.focusIndex]);
        this.d.anchorIndex = this.d.focusIndex;
      }
    }
    this.d.dirEntries = list;
    this.d.errMsg = undefined;
    this.d.fileInfoList = [];
    this.d.fileErrorList = [];
    useScrollToFocusState.getState().setScroll(ScrollLevel.Lazy); // 親ディレクトリに移動したときにうまくスクロールしないので遅延させる
  }

  setErrMsg(err: string) {
    this.d.errMsg = err;
  }
  getErrMsg() {
    return this.d.errMsg;
  }

  allowFetchFileInfo(index: number): boolean {
    return this.d.fileInfoList[index] === undefined && this.d.fileErrorList[index] === undefined;
  }
  getFileInfo(index: number): FileInfo | undefined {
    return this.d.fileInfoList[index];
  }
  setFileInfo(index: number, fileInfo: FileInfo) {
    // ※ このメソッドは TabInfo の updateCurrentTab() の中から呼ばれるので、updateCurrentTab は必要ない

    const ent = this.d.dirEntries?.[index];
    if (!ent) return;
    if (fileInfo.name !== ent.name) {
      console.error(
        `BUG: TabFiles.setFileInfo() path = ${this.d.path}, dirEntry.name = ${ent.name}, getFileInfo().name = ${fileInfo.name}`
      );
    }
    this.d.fileInfoList[index] = fileInfo;
  }
  getFileError(index: number): string | undefined {
    return this.d.fileErrorList?.[index];
  }
  setFileError(index: number, msg: string) {
    if (this.d.fileErrorList) this.d.fileErrorList[index] = msg;
  }

  pushHistory(dir: string, name: string) {
    this.#focusHistoryOp().push(dir, name);
  }

  #updateHistory() {
    if (this.d.path === undefined || this.d.dirEntries === undefined || this.d.dirEntries.length === 0) return;
    this.#focusHistoryOp().push(this.d.path, this.d.dirEntries[this.d.focusIndex].name);
  }

  getSelectionIndexes() {
    return this.d.selectionIndexes;
  }

  // ↑↓で普通にフォーカス移動、マウスクリックでファイル選択
  // Focus, Anchor, Select が変わる
  moveFocusNormal(index: number) {
    this.#updateCurrentTab(() => {
      this.#checkIndex(index);
      this.d.focusIndex = index;
      this.d.anchorIndex = index;
      this.d.selectionIndexes = new Set([index]);
      this.#updateHistory();
    })
  }

  // Ctrl + ↑↓でフォーカスだけが移動する
  // Select が変化せずに Focus, Anchor が変わる
  moveFocusOnly(index: number) {
    this.#updateCurrentTab(() => {
      this.#checkIndex(index);
      this.d.focusIndex = index;
      this.d.anchorIndex = index;
      this.#updateHistory();
    })
  }

  // Shift + ↑↓で選択エリアを変更する
  // Anchor が変化せずに Focus, Select が変わる
  moveFocusWithSelectionArea(index: number) {
    this.#updateCurrentTab(() => {
      this.#checkIndex(index);
      this.d.focusIndex = index;

      // 選択状態は、anchor -> focus まで
      this.d.selectionIndexes.clear();
      let from = this.d.anchorIndex;
      let to = this.d.focusIndex;
      if (to < from) {
        from = this.d.focusIndex;
        to = this.d.anchorIndex;
      }
      for (let i = from; i <= to; i++) {
        this.d.selectionIndexes.add(i);
      }
      this.#updateHistory();
    })
  }

  // Ctrl + 'Space' でフォーカス一の選択をON/OFF
  toggleSelection(index: number) {
    this.#updateCurrentTab(() => {
      if (this.d.selectionIndexes.has(index)) {
        this.d.selectionIndexes.delete(index);
      } else {
        this.d.selectionIndexes.add(index);
      }
    })
  }

  // Ctrl+A で全選択切替
  toggleAllSelection() {
    this.#updateCurrentTab(() => {
      if (!this.d.dirEntries) return;
      if (this.d.selectionIndexes.size === this.d.dirEntries.length) {
        this.d.selectionIndexes.clear();
      } else {
        for (let i = 0; i < this.d.dirEntries.length; i++) {
          this.d.selectionIndexes.add(i);
        }
      }
    })
  }
}
