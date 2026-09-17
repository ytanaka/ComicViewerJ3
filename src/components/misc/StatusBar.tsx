import { useCmdGetDirEntries } from '@/services/tab-dir-entry';
import { useTabStore } from '@/store/tab/store';
import { useUiVolatileStore } from '@/store/ui-volatile-store';

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
  const { data: dirEntries } = useCmdGetDirEntries(tab);
  const fileNum = dirEntries?.length;
  const full = useUiVolatileStore(state => state.isFullscreen);

  console.debug(`<NormalStatusBar> tab(${tab.id}) sel=${selSize} fileNum=${fileNum}`);

  let msg: string | undefined;
  if (fileNum !== undefined) {
    msg = `選択 ${selSize} / 全 ${fileNum}`;
  }

  return (
    <div className="border select-none" hidden={full} style={{ display: full ? 'none' : undefined }}>
      <div>{msg}</div>
    </div>
  );
}
