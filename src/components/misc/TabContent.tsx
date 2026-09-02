import FileList from '../file-list/FileList';
import { useEffect, useRef } from 'react';
import { useFocusStore } from '@/store/focus-store';
import { useTabStore } from '@/store/tab/store';

export function TabContent() {
  const ref = useRef<HTMLDivElement>(null);
  const getFocus = useFocusStore(state => state.getFocus);
  const doneFocus = useFocusStore(state => state.doneFocus);

  useEffect(() => {
    if (getFocus && ref.current) {
      ref.current.focus();
      doneFocus();
    }
  }, [getFocus, doneFocus]);

  const tabs = useTabStore(state => state.tabs);

  return (
    <div ref={ref} tabIndex={0} style={{ outline: 'none' }} className="flex flex-1 select-none">
      {tabs.length !== 0 ? (
        <FileList />
      ) : (
        <div className="w-full h-full justify-center items-center text-xl">No Tabs</div>
      )}
    </div>
  );
}
