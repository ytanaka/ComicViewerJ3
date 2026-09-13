import { DirEntry, TabInfo } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';
import { useRef } from 'react';
import { GridComponents, GridItemProps, GridListProps, VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso';

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
      <div style={{ padding: 4 }}>
        <div
          {...props}
          style={{
            width: 128,
            height: 128 + 15,
          }}
        >
          {children}
        </div>
      </div>
    );
  },
};

function ThumbnailCell({ tab, fileIndex, dirEntry }: { tab: TabInfo; fileIndex: number; dirEntry: DirEntry }) {
  if (fileIndex === 0) console.debug(`<ThumbnailCell>[${fileIndex}] tabId:${tab.id}`);

  return <div>{dirEntry.name}</div>;
}
