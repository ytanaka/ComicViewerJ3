import { getQueryData_getDirEntries, getQueryData_getDirEntries_error } from '@/services/files';
import { useTabStore } from '@/store/tab/store';

export function StatusBar() {
  const tabsLength = useTabStore(state => state.tabs.length);

  if (tabsLength === 0) {
    return <div></div>;
  } else {
    return <NormalStatusBar />;
  }
}

function NormalStatusBar() {
  const tab = useTabStore(state => state.getCurrentTab()!.info);
  const selSize = useTabStore(state => state.getCurrentTab()!.selection.selectionIndexes.size);
  const errMsg = getQueryData_getDirEntries_error(tab.id);
  const fileNum = getQueryData_getDirEntries(tab.id)?.length;

  let msg: string | undefined;
  if (fileNum !== undefined) {
    msg = `選択 ${selSize} / 全 ${fileNum}`;
  }

  return (
    <div className="border select-none">
      <div>{errMsg}</div>
      <div>{msg}</div>
    </div>
  );
}
