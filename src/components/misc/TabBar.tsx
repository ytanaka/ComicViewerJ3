import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
import { Plus, X } from 'lucide-react';

import { TabInfo, useTabState } from '@/store/tab-state';
import { Button } from '../ui/button';
import { tabCommands } from '@/lib/commands/tab-commands';
import { getPathBasename } from '@/lib/string-util';

export function TabBar() {
  const tabs = useTabState(state => state.tabs);
  const currentTabIndex = useTabState(state => state.currentTabIndex);

  return (
    <div className="flex border">
      <DragDropProvider
        onDragStart={e => {
          if (!isSortable(e.operation.source)) return;
          useTabState.getState().setCurrentTabIndex(e.operation.source.index);
        }}
        onDragEnd={e => {
          if (e.canceled) return;
          // initialIndex, index を読むため
          if (!isSortable(e.operation.source)) return;
          const { initialIndex, index } = e.operation.source;
          useTabState.getState().moveTab(initialIndex, index);
        }}
        modifiers={defaults => [...defaults, RestrictToHorizontalAxis]}
      >
        <div className="flex overflow-hidden">
          {tabs.map((t, i) => (
            <TabButton key={t.id} tab={t} index={i} isSelected={i == currentTabIndex} />
          ))}
        </div>
      </DragDropProvider>
      <NewTabButton noTabs={tabs.length === 0} />
    </div>
  );
}

function NewTabButton({ noTabs }: { noTabs: boolean }) {
  return (
    <Button variant={noTabs ? 'default' : 'outline'} onClick={() => tabCommands.addTab()}>
      <Plus />
      {noTabs ? 'Add Tab' : ''}
    </Button>
  );
}

function TabButton({ tab, index, isSelected }: { tab: TabInfo; index: number; isSelected: boolean }) {
  const { ref, handleRef } = useSortable({
    id: tab.id,
    index: index,
  });
  return (
    <div ref={ref} className="truncate relative inline-block group">
      <Button
        ref={handleRef}
        variant={`${isSelected ? 'outline' : 'secondary'}`}
        className={`block truncate text-left w-full max-w-full ${isSelected ? '' : 'font-light'}`}
      >
        {isSelected ? tab.path : getPathBasename(tab.path)}
      </Button>
      <div className="flex justify-end">
        <div
          onClick={() => tabCommands.removeTab(index)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-gray-500 rounded-md "
        >
          <X size="15" />
        </div>
      </div>
    </div>
  );
}
