import { useTabState } from '@/store/tab-state';
import FileList from './file-list/FileList';

export function TabContent() {
  const tabs = useTabState(state => state.tabs);
  if (tabs.length === 0) {
    return <div className="flex w-full h-full justify-center items-center text-xl">No Tabs</div>;
  } else {
    return <FileList className="flex-1" />;
  }
}
