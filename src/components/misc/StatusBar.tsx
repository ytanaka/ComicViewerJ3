
export function StatusBar() {
  const tabs = useTabState(state => state.tabs);
  if (tabs.length === 0) {
    return <div></div>;
  } else {
    return <NormalStatusBar />
  }
}

function NormalStatusBar() {
  const tab = useTabState(state => state.getCurrentTab());
  const tabFilesOp = useTabFilesOp(tab);
  const dirEntries = tabFilesOp.getDirEntries();

  let msg: string | undefined;
  if (dirEntries !== undefined) {
    const n = dirEntries.length;
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