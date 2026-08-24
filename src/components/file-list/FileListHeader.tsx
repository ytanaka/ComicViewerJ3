import { Layout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable"
import { FileListHeaderN, useUiState } from "@/store/ui-state";

export function FileListHeader() {
  const getFileListHeaderSize = useUiState(state => state.getFileListHeaderSizes);
  const setFileListHeaderSize = useUiState(state => state.setFileListHeaderSizes);
  const sizes = getFileListHeaderSize();

  function handleLayoutChanged(layout: Layout) {
    const sizes: number[] = [];
    Object.values(FileListHeaderN).filter((v) => typeof v === "number").forEach((k) => {
      sizes[k] = layout[`${k}`];
    });
    setFileListHeaderSize(sizes);
  }

  return (
    <div className="w-full ">
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex w-full"
        onLayoutChanged={handleLayoutChanged}
      >
        <ResizablePanel id={`${FileListHeaderN.Name}`} defaultSize={sizes[FileListHeaderN.Name]}>
          <div className="pl-10 text-ellipsis overflow-hidden text-nowrap">名前</div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel id={`${FileListHeaderN.Ext}`} defaultSize={sizes[FileListHeaderN.Ext]}>
          <div className="pl-1 text-ellipsis overflow-hidden text-nowrap">拡張子</div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel id={`${FileListHeaderN.Size}`} defaultSize={sizes[FileListHeaderN.Size]}>
          <div className="pl-1 text-ellipsis overflow-hidden text-nowrap">サイズ</div>
        </ResizablePanel>
        <ResizableHandle withHandle />

        <ResizablePanel id={`${FileListHeaderN.Date}`} defaultSize={sizes[FileListHeaderN.Date]}>
          <div className="pl-1 text-ellipsis overflow-hidden text-nowrap">更新日時</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div >
  )
}
