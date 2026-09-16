import { ReactNode, useEffect, useRef } from 'react';
import { ItemProps, ListRange, TableProps, TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';

import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { useTabStore } from '@/store/tab/store';
import { useUiStore } from '@/store/ui-store';
import { DirEntry } from '@/lib/bindings-wrapper';
import { CmdFileInfosQueryWrapper, useVisibleFileIdsStore } from '../CmdFileInfosQueryWrapper';
import { useListScrollHandlerStore } from '@/store/list-scroll-handler-store';

export default function FileList({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず

  const setRows = useListScrollHandlerStore(state => state.setRows);
  const setColumns = useListScrollHandlerStore(state => state.setColumns);
  const setScrollHandler = useListScrollHandlerStore(state => state.setScrollHandler);

  // スクロール機能登録
  useEffect(() => {
    setScrollHandler((fileIndex: number) => {
      virtuoso.current?.scrollIntoView({ index: fileIndex });
    });
  }, [setScrollHandler]);

  const handleRangeChanged = (range: ListRange) => {
    setRows(Math.max(1, range.endIndex - range.startIndex));
    setColumns(1);
    // ファイル情報読み込み
    useVisibleFileIdsStore.getState().setFileIndexes(tab.id, dirEntries, range);
  };

  const fileListHeaderSizes = useUiStore(state => state.fileListHeaderSizes);

  return (
    <div className="w-full h-full">
      <CmdFileInfosQueryWrapper tab={tab} />
      <div className="w-full h-full">
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
