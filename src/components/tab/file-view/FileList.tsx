import { ReactNode, useEffect, useRef } from 'react';
import { ItemProps, ListRange, TableProps, TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';

import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { useTabStore } from '@/store/tab/store';
import { fileSearchInput_handleKeyDown } from '@/lib/event-handler/file-search-input-key-handler';
import { tabFiles_handleKeyDown } from '@/lib/event-handler/tab-files-key-handler';
import { useUiStore } from '@/store/ui-store';
import { DirEntry } from '@/lib/bindings-wrapper';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';
import { CmdFileInfosQueryWrapper, useVisibleFileIdsStore } from '../CmdFileInfosQueryWrapper';

export default function FileList({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  useTabStore(state => state.getCurrentTab()?.refreshCount); // ソート状態が変わったら再レンダーする

  // 画面に表示されている行数
  const visibleListRows = useRef(1);
  const handleRangeChanged = (range: ListRange) => {
    visibleListRows.current = Math.max(1, range.endIndex - range.startIndex);
    // ファイル情報読み込み
    useVisibleFileIdsStore.getState().setFileIndexes(tab.id, dirEntries, range);
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
