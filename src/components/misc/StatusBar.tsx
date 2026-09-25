import { useCmdGetDirEntries } from '@/services/tab-dir-entry';
import { getQueryData_getFileInfo1 } from '@/services/tab-file-info';
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
  const sel = useTabStore(state => state.getCurrentTab()!.selection.selectionIndexes);
  const selSize = sel.size;
  const { data: dirEntries } = useCmdGetDirEntries(tab);
  const fileNum = dirEntries?.length;
  const full = useUiVolatileStore(state => state.isFullscreen);

  let totalSize = 0;
  let totalSizeUnknown = false;
  sel.forEach(i => {
    if (dirEntries?.[i] && !dirEntries[i].is_dir) {
      const fileInfo = getQueryData_getFileInfo1(tab.id, dirEntries[i].file_id)
      const size = fileInfo?.metadata.Right?.size;
      if (size !== undefined && size !== null) {
        totalSize += size;
      } else {
        totalSizeUnknown = true;
      }
    }
  })

  console.debug(`<NormalStatusBar> tab(${tab.id}) sel=${selSize} fileNum=${fileNum}`);

  let msg = '';
  if (fileNum !== undefined) {
    if (0 < totalSize) {
      msg = `${totalSize.toLocaleString()}バイト${totalSizeUnknown ? "以上？" : ""}`;
    }
    msg = `${msg} (選択 ${selSize} / 全 ${fileNum})`;
  }

  return (
    <div className="flex border select-none" hidden={full} style={{ display: full ? 'none' : undefined }}>
      <div className='flex-1' />
      <div className='mr-2' >{msg}</div>
    </div>
  );
}
