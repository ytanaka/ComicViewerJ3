import { ReactNode, useEffect, useRef } from 'react';
import { ItemProps, ListRange, TableProps, TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';

import { basename as tauri_basename, dirname as tauri_dirname } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { useTabStore } from '@/store/tab/store';
import { fileSearchInput_handleKeyDown } from '@/lib/event-handler/file-search-input-key-handler';
import { tabFiles_handleKeyDown } from '@/lib/event-handler/tab-files-key-handler';
import { useUiStore } from '@/store/ui-store';
import { useCmdCreateTab, useCmdFileInfosQuery, useCmdGetDirEntries } from '@/services/files';
import { FileId } from '@/store/tab/types';
import { getObjId } from '@/lib/utils';
import { create } from 'zustand';
import { TabInfo } from '@/lib/bindings-wrapper';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';

function st() {
  return useTabStore.getState();
}

export default function FileList() {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const currentTabIndex = useTabStore(state => state.currentTabIndex);
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず

  console.debug(`<FileList> tab[${currentTabIndex}](id:${tab.id}), ${tab.path} tab:${getObjId(tab)} `);

  // タブ情報作成
  useCmdCreateTab(tab);
  // ファイル一覧取得
  const { data: dirEntries } = useCmdGetDirEntries(tab);

  // 親ディレクトリに移動したときに現在ディレクトリが選択されてほしいので、履歴に追加しておく
  useEffect(() => {
    const setHist = async () => {
      try {
        const parent = await tauri_dirname(tab.path);
        if (!st().findHistory(tab.id, parent)) {
          const base = await tauri_basename(tab.path);
          st().pushHistory(tab.id, parent, base);
        }
      } catch {
        // 現ディレクトリに親ディレクトリがない場合は例外が発生するので無視する
      }
    };
    setHist();
  }, [tab.id, tab.path]); // 初回表示時だけ実行する

  // タイトルバー更新
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tab.path);
    };
    setTitle();
  }, [tab.path]);

  // スクロール位置検知
  const visibleListRows = useRef(1);
  const handleRangeChanged = (range: ListRange) => {
    // スクロール位置が変化したら、表示する範囲のファイル情報を取得する
    visibleListRows.current = Math.max(1, range.endIndex - range.startIndex);

    // ファイル情報読み込み
    if (dirEntries) {
      const fileIds: FileId[] = [];
      for (let i = range.startIndex; i <= range.endIndex; i++) {
        const ent = dirEntries[i];
        if (ent) fileIds.push(ent.file_id);
      }
      useScrollFileIdsStore.getState().setFileIds(fileIds);
    }
  };

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (virtuoso.current === null) return;
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      if (100 < delay) {
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
      const focusIndex = st().getCurrentTab()?.selection.focusIndex;
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

// <FileList> 内にスクロールした結果を useState<ListRange>() すると、スクロールするたびに <FileList> がレンダーされるので、
// このコンポーネントを <FileList> の子にする
export function CmdFileInfosQueryWrapper({ tab }: { tab: TabInfo }) {
  const fileIds = useScrollFileIdsStore(state => state.fileIds);
  useCmdFileInfosQuery(tab, fileIds);
  return <></>;
}

export interface ScrollFileIdsStore {
  fileIds: FileId[];
  setFileIds: (fileIds: FileId[]) => void;
}

export const useScrollFileIdsStore = create<ScrollFileIdsStore>()(set => ({
  fileIds: [],
  setFileIds: (fileIds: FileId[]) => {
    set(() => ({ fileIds }));
  },
}));
