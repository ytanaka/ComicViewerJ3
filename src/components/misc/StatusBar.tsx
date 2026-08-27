import { useTabFilesOp } from '@/store/tab-files';
import { useTabState } from '@/store/tab-state';

export function StatusBar() {
  const tab = useTabState(state => state.getCurrentTab());
  if (!tab) {
    return <div></div>;
  } else {
    return <NormalStatusBar />
  }
}

function NormalStatusBar() {
  const tab = useTabState(state => state.getCurrentTab());
  const tabFilesOp = useTabFilesOp(tab);

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