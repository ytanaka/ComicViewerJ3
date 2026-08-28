import { useTabStore } from "@/store/tab/store";

export function StatusBar() {
  const tabs = useTabStore(state => state.tabs);

  if (tabs.length === 0) {
    return <div></div>;
  } else {
    return <NormalStatusBar />
  }
}

function NormalStatusBar() {
  const tab = useTabStore(state => state.getCurrentTab());
  const selection = useTabStore(state => state.getSelection(tab.id));
  const dirEntries = tab.dirEntries;

  let msg: string | undefined;
  if (dirEntries !== undefined) {
    const n = dirEntries.length;
    const sel = selection.selectionIndexes.size;
    msg = `選択 ${sel} / 全 ${n}`;
  }

  return (
    <div className="border">
      <div>{tab.errorMsg}</div>
      <div>{msg}</div>
    </div>
  );
}