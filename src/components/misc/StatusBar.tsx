import { useTabState } from '@/store/tab-state';

export function StatusBar() {
  const currentTabIndex = useTabState(state => state.currentTabIndex);
  const tabs = useTabState(state => state.tabs);
  if (tabs.length === 0) {
    return <div></div>;
  }

  const tab = tabs[currentTabIndex];
  const err = tab.files.getErrMsg();
  let msg: string | undefined;
  if (tab.files.isInitialized()) {
    const n = tab.files.getDirEntries().length;
    const sel = tab.files.getSelectionIndexes().size;
    msg = `選択 ${sel} / 全 ${n}`;
  }

  return (
    <div className="border">
      <div>{err}</div>
      <div>{msg}</div>
    </div>
  );
}
