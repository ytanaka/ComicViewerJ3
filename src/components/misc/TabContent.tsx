import FileList from '../file-list/FileList';
import { useEffect, useRef } from 'react';
import { useFocusStore } from '@/store/focus-store';
import { useTabStore } from '@/store/tab/store';
import { FileViewMode } from '@/store/tab/types';
import { ThumbnailList } from '../thumbnail-list/ThumbnailList';

export function TabContent() {
  const ref = useRef<HTMLDivElement>(null);
  const getFocus = useFocusStore(state => state.getFocus);
  const doneFocus = useFocusStore(state => state.doneFocus);
  const fileViewMode = useTabStore(state => state.getCurrentTab()?.fileViewMode);

  useEffect(() => {
    if (getFocus && ref.current) {
      ref.current.focus();
      doneFocus();
    }
  }, [getFocus, doneFocus]);

  const tabsLength = useTabStore(state => state.tabs.length);

  return (
    <div ref={ref} tabIndex={0} style={{ outline: 'none' }} className="flex flex-1 select-none">
      {tabsLength === 0 ? (
        <div className="w-full h-full justify-center items-center text-xl">No Tabs</div>
      ) : fileViewMode === FileViewMode.Thumbnail ? (
        <ThumbnailList />
      ) : (
        <FileList />
      )}
    </div>
  );
}
