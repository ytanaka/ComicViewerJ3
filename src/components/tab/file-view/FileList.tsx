import { ReactNode, useEffect, useRef } from 'react';
import { ItemProps, ListRange, TableProps, TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';

import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { useTabStore } from '@/store/tab/store';
import { fileSearchInput_handleKeyDown } from '@/lib/event-handler/file-search-input-key-handler';
import { tabFiles_handleKeyDown } from '@/lib/event-handler/tab-files-key-handler';
import { useUiStore } from '@/store/ui-store';
import { getQueryData_getFileInfo1, useCmdFileInfosQuery, } from '@/services/files';
import { FileId, TabId } from '@/store/tab/types';
import { create } from 'zustand';
import { DirEntry, TabInfo } from '@/lib/bindings-wrapper';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';

export default function FileList({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  useTabStore(state => state.getCurrentTab()?.refreshCount); // ソート状態が変わったら再レンダーする

  // 画面に表示されている行数
  const visibleListRows = useRef(1);
  const handleRangeChanged = (range: ListRange) => {
    // スクロール位置が変化したら、表示する範囲のファイル情報を取得する
    visibleListRows.current = Math.max(1, range.endIndex - range.startIndex);

    // ファイル情報読み込み
    if (dirEntries) {
      const OVER_SCAN = visibleListRows.current + 1;
      const fileIds: FileId[] = [];
      const s = Math.max(0, range.startIndex - OVER_SCAN);
      const e = Math.min(dirEntries.length - 1, range.endIndex + OVER_SCAN);
      for (let i = s; i <= e; i++) {
        const ent = dirEntries[i];
        if (ent) fileIds.push(ent.file_id);
      }
      if (fileIds.length !== 0) useScrollFileIdsStore.getState().setFileIds(tab.id, fileIds);
    }
  };

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (virtuoso.current === null) return;
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      const timeout = useUiStore.getState().timeoutMsEventTimeStamp;
      if (0 < timeout && timeout < delay) {
        console.info('ignore keyboard event');
        return;
      }

      // ファイル検索テキスト入力
      if (fileSearchInput_handleKeyDown(e, virtuoso.current)) {
        return;
      }

      if (tabFiles_handleKeyDown(e, tab, visibleListRows.current, virtuoso.current)) {
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // 初回だけ実行する

  // スクロール位置調整
  const doScroll = useScrollToFocusStore(state => state.doScroll);
  const setScroll = useScrollToFocusStore(state => state.setScroll);
  useEffect(() => {
    if (!doScroll) return;
    function scr() {
      const focusIndex = useTabStore.getState().getCurrentTab()?.selection.focusIndex;
      if (focusIndex !== undefined) {
        virtuoso.current?.scrollIntoView({
          index: focusIndex,
        });
      }
    }

    // 親ディレクトリに移動したときにうまくスクロールしないので遅延させる
    setTimeout(() => scr(), 100);
    setScroll(false);
  }, [doScroll, setScroll]); // スクロールが指示されたら実行する

  const fileListHeaderSizes = useUiStore(state => state.fileListHeaderSizes);

  return (
    <div className="flex flex-1 flex-col">
      <CmdFileInfosQueryWrapper tab={tab} />
      <div className="flex-1">
        {dirEntries === undefined ? (
          <div>更新中</div>
        ) : (
          <TableVirtuoso
            ref={virtuoso}
            components={{
              TableRow: (props: ItemProps<ReactNode>) => (
                <FileListRow
                  tab={tab}
                  fileIndex={props['data-index']}
                  dirEntry={dirEntries[props['data-index']]}
                  {...props}
                />
              ),
              Table: ({ children, ...props }: TableProps) => (
                <table {...props} className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: fileListHeaderSizes[0] }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: fileListHeaderSizes[2] }} />
                    <col style={{ width: fileListHeaderSizes[3] }} />
                    <col style={{ width: fileListHeaderSizes[4] }} />
                  </colgroup>
                  {children}
                </table>
              ),
            }}
            fixedHeaderContent={FileListHeader}
            totalCount={dirEntries.length}
            rangeChanged={handleRangeChanged}
          />
        )}
      </div>
    </div>
  );
}

// <FileList> 内でスクロールした結果を useState<ListRange>() するとスクロールするたびに <FileList> がレンダーされる。
// このコンポーネントを <FileList> の子にすれば <FileList> は影響を受けない
function CmdFileInfosQueryWrapper({ tab }: { tab: TabInfo }) {
  const fileIds = useScrollFileIdsStore(state => state.fileIds);
  const tabId = useScrollFileIdsStore(state => state.tabId);

  // まだデータ未取得のファイルだけ抽出
  const fileIds2 = fileIds.filter(fileId => {
    const fileInfo = getQueryData_getFileInfo1(tab.id, fileId);
    return fileInfo === undefined;
  });
  // スクロール範囲が設定されたときのTabIdと現在レンダーされているタブIDを確認する
  useCmdFileInfosQuery(tab, tabId == tab.id ? fileIds2 : []);
  return <></>;
}

interface ScrollFileIdsStore {
  tabId: TabId;
  fileIds: FileId[];
  setFileIds: (tabId: TabId, fileIds: FileId[]) => void;
}

const useScrollFileIdsStore = create<ScrollFileIdsStore>()(set => ({
  tabId: 0 as TabId,
  fileIds: [],
  setFileIds: (tabId: TabId, fileIds: FileId[]) => {
    set(() => ({ tabId, fileIds }));
  },
}));
