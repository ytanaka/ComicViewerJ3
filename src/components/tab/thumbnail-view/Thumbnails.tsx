import { useEffect, useRef, useState } from 'react';
import { GridComponents, GridItemProps, GridListProps, ListRange, VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso';

import { DirEntry } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';
import { ThumbnailCell } from './ThumbnailCell';
import { CmdFileInfosQueryWrapper, useVisibleFileIdsStore } from '../CmdFileInfosQueryWrapper';

// サムネイル<div>を取得し、列数を計算するためにこの文字列を className に設定する
export const THUMBNAIL_CELL_CLASSNAME = "thumbnail_cells";

// VirtuosoGrid のリスト全体と個別項目のスタイル設定
const gridComponents: GridComponents = {
  List: ({ style, children, ...props }: GridListProps) => {
    return (
      <div
        {...props}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flex: 1,
          ...style,
        }}
      >
        {children}
      </div>
    );
  },
  Item: ({ children, ...props }: GridItemProps) => {
    return (
      <div style={{ padding: 4 }}>
        <div
          {...props}
          style={{
            width: 128,
            height: 'calc(128 + 1lh)',
          }}
        >
          {children}
        </div>
      </div>
    );
  },
};

export function Thumbnails({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const virtuoso = useRef<VirtuosoGridHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<number>(1);
  const [rows, setRows] = useState<number>(1);

  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず

  console.debug(`<Thumbnails> dirEntries=[${dirEntries?.length}]`);

  // 行数、列数の計算
  const updateRowsColumns = () => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll(`.${THUMBNAIL_CELL_CLASSNAME}`);
    if (items.length === 0) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    // 上辺、左辺の座標を集める
    const topSet = new Set<number>();
    const leftSet = new Set<number>();
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();

      // 左辺座標
      leftSet.add(rect.left);

      // 上辺座標
      const isFullyVisible =
        rect.top >= containerRect.top &&
        rect.bottom <= containerRect.bottom;
      if (isFullyVisible) topSet.add(rect.top);
    });
    const newColumns = Math.max(1, leftSet.size);
    const newRows = Math.max(1, topSet.size);

    if (newColumns !== columns) {
      console.log("Thumbnails: columns changed(", columns, "=>", newColumns, ")");
      setColumns(newColumns);
    }
    if (newRows !== rows) {
      console.log("Thumbnails: rows changed(", rows, "=>", newRows, ")");
      setRows(newRows);
    }
  };

  // 画面リサイズ時に行数、列数を再計算
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(updateRowsColumns);
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  });

  const handleRangeChanged = (range: ListRange) => {
    // ResizeObserver が画面初期表示時に呼ばれないので、ここでも呼んでおく
    updateRowsColumns();
    // ファイル情報読み込み
    useVisibleFileIdsStore.getState().setFileIndexes(tab.id, dirEntries, range);
  };

  if (dirEntries === undefined) {
    return <div>更新中</div>;
  } else {
    return (
      <div ref={containerRef} className='flex flex-1'>
        <CmdFileInfosQueryWrapper tab={tab} />
        <VirtuosoGrid
          className="flex-1"
          ref={virtuoso}
          totalCount={dirEntries.length}
          itemContent={index => <ThumbnailCell tab={tab} fileIndex={index} dirEntry={dirEntries[index]} />}
          components={gridComponents}
          rangeChanged={handleRangeChanged}
        />
      </div>
    );
  }
}
