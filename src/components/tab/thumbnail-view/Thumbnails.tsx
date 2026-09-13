import { useRef } from 'react';
import { GridComponents, GridItemProps, GridListProps, VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso';

import { DirEntry } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';
import { ThumbnailCell } from './ThumbnailCell';

const THUMBNAIL_CELL_CLASSNAME = "thumbnail_cell";

export function Thumbnails({ dirEntries }: { dirEntries: DirEntry[] | undefined }) {
  const virtuoso = useRef<VirtuosoGridHandle>(null);
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず

  console.debug(`<Thumbnails> dirEntries=[${dirEntries?.length}]`);

  if (dirEntries === undefined) {
    return <div>更新中</div>;
  } else {
    return (
      <VirtuosoGrid
        className="flex-1"
        ref={virtuoso}
        totalCount={dirEntries.length}
        itemContent={index => <ThumbnailCell tab={tab} fileIndex={index} dirEntry={dirEntries[index]} />}
        components={gridComponents}
      />
    );
  }
}

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
      <div className={`${THUMBNAIL_CELL_CLASSNAME}`} style={{ padding: 4 }}>
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
