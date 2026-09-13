import { useEffect, useRef, useState } from 'react';
import {
  GridComponents,
  GridItemProps,
  GridListProps,
  ListRange,
  VirtuosoGrid,
  VirtuosoGridHandle,
} from 'react-virtuoso';

import { DirEntry } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';
import { ThumbnailCell } from './ThumbnailCell';
import { CmdFileInfosQueryWrapper, useVisibleFileIdsStore } from '../CmdFileInfosQueryWrapper';
import { useUiStore } from '@/store/ui-store';
import { fileSearchInput_handleKeyDown } from '@/lib/event-handler/file-search-input-key-handler';
import { tabFiles_handleKeyDown } from '@/lib/event-handler/tab-files-key-handler';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';

// サムネイル<div>を取得し、列数を計算するためにこの文字列を className に設定する
export const THUMBNAIL_CELL_CLASSNAME = 'thumbnail_cells';

// VirtuosoGrid のリスト全体と個別項目のスタイル設定
const gridComponents: GridComponents = {
  List: ({ style, children, ...props }: GridListProps) => {
    return (
      <div
        {...props}
        style={{
          overflowX: 'hidden', // ※ これを入れないと、画面幅を変えたときに一瞬横スクロールバーが出る
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
          margin: 4,
          width: 128,
          height: 'calc(128 + 1lh)',
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

    if (newColumns !== columns) {
      console.log('Thumbnails: columns changed(', columns, '=>', newColumns, ')');
      setColumns(newColumns);
    }
    if (newRows !== rows) {
      console.log('Thumbnails: rows changed(', rows, '=>', newRows, ')');
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

      const scroll = {
        scroll: (i: number) => virtuoso.current?.scrollToIndex({ index: i })
      };

      // ファイル検索テキスト入力
      if (fileSearchInput_handleKeyDown(e, scroll)) {
        return;
      }

      if (tabFiles_handleKeyDown(e, tab, rows, columns, scroll)) {
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
        virtuoso.current?.scrollToIndex({
          index: focusIndex,
        });
      }
    }

    // 親ディレクトリに移動したときにうまくスクロールしないので遅延させる
    setTimeout(() => scr(), 100);
    setScroll(false);
  }, [doScroll, setScroll]); // スクロールが指示されたら実行する

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
      <div ref={containerRef} className="h-full w-full">
        <CmdFileInfosQueryWrapper tab={tab} />
        <VirtuosoGrid
          ref={virtuoso}
          totalCount={dirEntries.length}
          itemContent={index => <ThumbnailCell tab={tab} fileIndex={index} dirEntry={dirEntries[index]} />}
          components={gridComponents}
          rangeChanged={handleRangeChanged}
        />
        <style>{`html, body, #root { margin: 0; padding: 0 }`}</style>
      </div>
    );
  }
}
