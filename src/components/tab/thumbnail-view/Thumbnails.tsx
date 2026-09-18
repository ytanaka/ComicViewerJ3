import { useEffect, useRef } from 'react';
import {
  GridComponents,
  GridItemProps,
  GridListProps,
  ListRange,
  VirtuosoGrid,
  VirtuosoGridHandle,
} from 'react-virtuoso';

import { DirEntry } from '@/lib/bindings-wrapper';
import { getTabStore, useTabStore } from '@/store/tab/store';
import { ThumbnailCell } from './ThumbnailCell';
import { CmdFileInfosQueryWrapper, useVisibleFileIdsStore } from '../CmdFileInfosQueryWrapper';
import { useListScrollHandlerStore } from '@/store/list-scroll-handler-store';

// サムネイル<div>を取得し、列数を計算するためにこの文字列を className に設定する
export const THUMBNAIL_CELL_CLASSNAME = 'thumbnail_cells';

export const THUMBNAIL_SIZE_LIST = [64, 96, 128, 192, 256, 384, 512];
export const THUMBNAIL_SIZE_DEFAULT = 128;
export const THUMBNAIL_PADDING = 4;

// VirtuosoGrid のリスト全体と個別項目のスタイル設定
const gridComponents: GridComponents = {
  List: ({ style, children, ...props }: GridListProps) => {
    return (
      <div
        {...props}
        style={{
          overflow: 'hidden', // ※ これを入れないと、画面幅を変えたときに一瞬横スクロールバーが出る
          display: 'flex',
          flexWrap: 'wrap',
          ...style,
        }}
      >
        {children}
      </div>
    );
  },
  Item: ({ children, ...props }: GridItemProps) => {
    return (
      <div
        {...props}
        style={{
          padding: THUMBNAIL_PADDING,
          // VirtuosoGrid のItemサイズは全Item同じpxで指定する
          // そうしないと、スクロールしたときに項目が左右にずれる
          // width: THUMBNAIL_SIZE + 2 * THUMBNAIL_PADDING,
          // height: 150,// height は指定しなくてもいい？
        }}
      >
        {children}
      </div>
    );
  },
};

export function Thumbnails({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const virtuoso = useRef<VirtuosoGridHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const setRows = useListScrollHandlerStore(state => state.setRows);
  const setColumns = useListScrollHandlerStore(state => state.setColumns);
  const setScrollHandler = useListScrollHandlerStore(state => state.setScrollHandler);

  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  const focusIndex = getTabStore.getState().getCurrentTab()?.selection.focusIndex ?? 0;

  console.debug(`<Thumbnails> dirEntries=[${dirEntries?.length}] focus=${focusIndex}`);

  // スクロール機能登録
  useEffect(() => {
    setScrollHandler((fileIndex: number) => {
      virtuoso.current?.scrollToIndex({ index: fileIndex, align: 'center' });
    });
  }, [setScrollHandler]);

  // 行数、列数の計算
  const updateRowsColumns = () => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll(`.${THUMBNAIL_CELL_CLASSNAME}`);
    if (items.length === 0) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    // 上辺、左辺の座標を集める
    const topSet = new Set<number>();
    const leftSet = new Set<number>();
    items.forEach(item => {
      const rect = item.getBoundingClientRect();

      // 左辺座標
      leftSet.add(rect.left);

      // 上辺座標
      const isFullyVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
      if (isFullyVisible) topSet.add(rect.top);
    });
    const newColumns = Math.max(1, leftSet.size);
    const newRows = Math.max(1, topSet.size);

    setColumns(newColumns);
    setRows(newRows);
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
  } else if (dirEntries.length === 0) {
    return <div>ファイルがありません</div>;
  } else {
    return (
      <div ref={containerRef} className="h-full w-full">
        <CmdFileInfosQueryWrapper tab={tab} />
        <VirtuosoGrid
          ref={virtuoso}
          totalCount={dirEntries.length}
          itemContent={index => <ThumbnailCell tab={tab} fileIndex={index} dirEntry={dirEntries[index]} />}
          components={gridComponents}
          rangeChanged={handleRangeChanged}
          initialTopMostItemIndex={{ index: focusIndex, align: 'center' }}
        />
        <style>{`html, body, #root { margin: 0; padding: 0 }`}</style>
      </div>
    );
  }
}
