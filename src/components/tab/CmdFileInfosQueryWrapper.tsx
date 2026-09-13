import { create } from "zustand";

import { DirEntry, TabInfo } from "@/lib/bindings-wrapper";
import { getQueryData_getFileInfo1, useCmdFileInfosQuery } from "@/services/tab-file-info";
import { FileId, TabId } from "@/store/tab/types";
import { ListRange } from "react-virtuoso";

// <FileList> 内でスクロールした結果を useState<ListRange>() するとスクロールするたびに <FileList> がレンダーされる。
// このコンポーネントを <FileList> の子にして useVisibleFileIdsStore にデータを格納すれば <FileList> は影響を受けない
export function CmdFileInfosQueryWrapper({ tab }: { tab: TabInfo }) {
  const tabId = useVisibleFileIdsStore(state => state.tabId);
  const fileIds = useVisibleFileIdsStore(state => state.fileIds);

  // まだデータ未取得のファイルだけ抽出
  const fileIds2 = fileIds.filter(fileId => {
    const fileInfo = getQueryData_getFileInfo1(tab.id, fileId);
    return fileInfo === undefined;
  });

  // ファイル情報一括取得
  // ※ スクロール範囲が設定されたときのTabIdと現在レンダーされているタブIDを確認する
  useCmdFileInfosQuery(tab, tabId == tab.id ? fileIds2 : []);
  return <></>;
}

interface VisibleFileIdsStore {
  tabId: TabId;
  fileIds: FileId[];
  setFileIndexes: (tabId: TabId, dirEntries: DirEntry[] | undefined, range: ListRange) => void;
}

// ファイル一覧画面で、スクロール範囲に見えているファイルのID一覧を格納する
export const useVisibleFileIdsStore = create<VisibleFileIdsStore>()(set => ({
  tabId: 0 as TabId,
  fileIds: [],

  setFileIndexes: (tabId: TabId, dirEntries: DirEntry[] | undefined, range: ListRange) => {
    if (!dirEntries) return;
    const itemNum = Math.max(1, range.endIndex - range.startIndex);
    const OVER_SCAN = itemNum + 1;
    const fileIds: FileId[] = [];
    const s = Math.max(0, range.startIndex - OVER_SCAN);
    const e = Math.min(dirEntries.length - 1, range.endIndex + OVER_SCAN);
    for (let i = s; i <= e; i++) {
      const ent = dirEntries[i];
      if (ent) fileIds.push(ent.file_id);
    }
    if (fileIds.length !== 0) {
      set(() => ({ tabId, fileIds }));
    }
  },
}));
