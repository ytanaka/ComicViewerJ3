import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { Plus, X } from 'lucide-react';

import { TabInfo, useTabState } from '@/store/tab-state';
import { Button } from './ui/button';

export function TabBar({ onNewTab, onRemoveTab }: { onNewTab: () => void, onRemoveTab: (index: number) => void }) {
  const tabs = useTabState(state => state.tabs);
  const moveTab = useTabState(state => state.moveTab);
  const currentTabIndex = useTabState(state => state.currentTabIndex);
  const setCurrentTabIndex = useTabState(state => state.setCurrentTabIndex);

  return (
    <div className="flex border">
      <DragDropProvider
        onDragStart={e => {
          if (!isSortable(e.operation.source)) return;
          setCurrentTabIndex(e.operation.source.index);
        }}
        onDragEnd={e => {
          if (e.canceled) return;
          // initialIndex, index を読むため
          if (!isSortable(e.operation.source)) return;
          const { initialIndex, index } = e.operation.source;
          moveTab(initialIndex, index);
        }}
        modifiers={defaults => [...defaults, RestrictToHorizontalAxis]}
      >
        <div className="flex">
          {tabs.map((t, i) => (
            <TabButton key={t.id} tab={t} index={i} isSelected={i == currentTabIndex} onRemove={() => onRemoveTab(i)} />
          ))}
        </div>
      </DragDropProvider>
      <NewTabButton onClick={onNewTab} noTabs={tabs.length === 0} />
    </div>
  );
}

function NewTabButton({ onClick, noTabs }: { onClick: () => void; noTabs: boolean }) {
  return (
    <Button variant={noTabs ? 'default' : 'outline'} onClick={onClick}>
      <Plus />
      {noTabs ? 'Add Tab' : ''}
    </Button>
  );
}

function TabButton({
  tab,
  index,
  isSelected,
  onRemove,
}: {
  tab: TabInfo;
  index: number;
  isSelected: boolean;
  onRemove: () => void;
}) {
  const { ref, handleRef } = useSortable({
    id: tab.id,
    index: index,
  });
  return (
    <div ref={ref} className="relative inline-block group">
      <Button
        ref={handleRef}
        variant={`${isSelected ? 'outline' : 'secondary'}`}
        className={`${isSelected ? '' : 'font-light'}`}
      >
        {tab.path}
      </Button>
      <div className="w5 flex justify-end">
        <div
          onClick={onRemove}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black rounded-md"
        >
          <X />
        </div>
      </div>
    </div>
  );
}
