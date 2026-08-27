import { useTabState } from '@/store/tab-state';
import FileList from '../file-list/FileList';
import { useEffect, useRef } from 'react';
import { useFocusState } from '@/store/focus-state';

export function TabContent() {
  const ref = useRef<HTMLDivElement>(null);
  const getFocus = useFocusState(state => state.getFocus);
  const doneFocus = useFocusState(state => state.doneFocus);

  useEffect(() => {
    if (getFocus && ref.current) {
      ref.current.focus();
      doneFocus();
    }
  }, [getFocus, doneFocus]);

  const tabs = useTabState(state => state.tabs);

  return (
    <div ref={ref} tabIndex={0} style={{ outline: 'none' }} className="flex flex-1">
      {tabs.length !== 0 ? (
        <FileList />
      ) : (
        <div className="w-full h-full justify-center items-center text-xl">No Tabs</div>
      )}
    </div>
  );
}
