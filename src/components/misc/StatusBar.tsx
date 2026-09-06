import { useCmdGetDirEntries } from '@/services/files';
import { useTabStore } from '@/store/tab/store';

export function StatusBar() {
  const tabs = useTabStore(state => state.tabs);

  if (tabs.length === 0) {
    return <div></div>;
  } else {
    return <NormalStatusBar />;
  }
}

function NormalStatusBar() {
  const tab = useTabStore(state => state.getCurrentTab()!);
  const selection = tab.selection;
  const { data: data } = useCmdGetDirEntries(tab.info);

  let msg: string | undefined;
  let errMsg: string | undefined;
  if (data) {
    if (data.status === 'ok') {
      const n = data.data.length;
      const sel = selection.selectionIndexes.size;
      msg = `選択 ${sel} / 全 ${n}`;
    } else {
      errMsg = data.error;
    }
  }

  return (
    <div className="border select-none">
      <div>{errMsg}</div>
      <div>{msg}</div>
    </div>
  );
}
