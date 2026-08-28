import { commands } from "@/lib/bindings";
import { caeateTabFiles, TabFiles, TabFilesOp } from "./tab-files";
import { useTabState } from "./tab-state";
import { useMemo } from "react";
import { assert_eq, ExecExclusibe } from "@/lib/utils";

export interface TabInfo {
  id: number;
  files: TabFiles;

  execExclusive: ExecExclusibe; // dirEntries を取得中フラグ
};

export function createTabInfo(id: number, path: string): TabInfo {
  return {
    id: id,
    files: caeateTabFiles(path),
    execExclusive: new ExecExclusibe(),
  }
}

export const useTabInfoOp = (tab: TabInfo) => {
  return useMemo(() => {
    return new TabInfoOp(tab);
  }, [tab])
}

export class TabInfoOp {
  private d: TabInfo;

  get data() {
    return this.d;
  }

  constructor(data: TabInfo) {
    if (!data) throw new Error('invalid data');
    this.d = data;
  }

  #mkTabFilesOp() {
    return new TabFilesOp(this.d);
  }
  #updateCurrentTab(fn: () => void) {
    useTabState.getState().updateTab(this.d.id, tab => {
      assert_eq(tab?.id, this.d.id);
      fn();
    })
  }

  async readDirEntries() {
    // 同時呼び出しを防ぐ
    if (!this.d.execExclusive.try_start(0)) return;
    let result;
    try {
      console.debug(`TabInfo.readDirEntries(): id:${this.d.id}, path:${this.d.files.path}`);
      result = await commands.readDirEntries(this.d.id, this.d.files.path);
    } finally {
      this.d.execExclusive.end(0);
    }

    this.#updateCurrentTab(() => {
      if (result.status === 'ok') {
        this.#mkTabFilesOp().updateDirEntries(result.data);
      } else {
        console.info("TabInfo.readDirEntries() error: ", result.error);
        this.d.files.errMsg = result.error;
        this.#mkTabFilesOp().updateDirEntries([]);
      }
    })
  }

  async readFileInfo(index: number) {
    if (!this.d.files.dirEntries) throw Error('no dirEntries');
    if (!this.d.files.dirEntries[index]) throw Error(`no dirEntries[${index}]`);

    // 同時呼び出しを防ぐ
    if (!this.d.files.execExclusive.try_start(index)) return;
    let result;
    try {
      result = await commands.getFileInfo(this.d.id, this.d.files.dirEntries[index].id.toString());
    } finally {
      this.d.files.execExclusive.end(index);
    }

    this.#updateCurrentTab(() => {
      if (result.status === 'ok') {
        this.#mkTabFilesOp().setFileInfo(index, result.data);
      } else {
        console.info("TabInfo.readFileInfo() error: ", result.error);
        this.d.files.fileErrorList[index] = result.error;
      }
    });
  }

}
