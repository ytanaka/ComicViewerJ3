import { useCmdGetDirEntries, useCmdGetDirEntries_error } from '@/services/files';
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
  const { data: errMsg } = useCmdGetDirEntries_error(tab);
  const { data: dirEntries } = useCmdGetDirEntries(tab);
  const fileNum = dirEntries?.length;

  console.log(`<NormalStatusBar> tab(${tab.id}) sel=${selSize} fileNum=${fileNum}`);

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
