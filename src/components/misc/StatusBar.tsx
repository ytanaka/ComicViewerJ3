import { useTabFilesOp } from '@/store/tab-files';
import { useTabState } from '@/store/tab-state';

export function StatusBar() {
  const tabs = useTabState(state => state.tabs);
  if (tabs.length === 0) {
    return <div></div>;
  } else {
    return <NormalStatusBar />
  }
}

function NormalStatusBar() {
  const tabFilesOp = useTabFilesOp()


  let msg: string | undefined;
  if (tabFilesOp.isInitialized()) {
    const n = tabFilesOp.getDirEntries().length;
    const sel = tabFilesOp.getSelectionIndexes().size;
    msg = `選択 ${sel} / 全 ${n}`;
  }

  return (
    <div className="border">
      <div>{tabFilesOp.getErrMsg()}</div>
      <div>{msg}</div>
    </div>
  );

}