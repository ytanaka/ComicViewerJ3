import { useTabState } from '@/store/tab-state';
import FileList from './file-list/FileList';
import { useEffect, useRef } from 'react';

export function TabContent() {
  const ref = useRef<HTMLDivElement>(null);
  const tabs = useTabState(state => state.tabs);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;

      // メインコンポーネント以外にフォーカスが移ったら戻す
      if (ref.current && !ref.current.contains(target)) {
        ref.current.focus();
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // メイン以外をクリックしたらフォーカスを戻す
      if (ref.current && !ref.current.contains(target)) {
        ref.current.focus();
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('click', handleClick);
    };
  }, []);

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
