import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable"

export function FileListHeader() {
  return (
    <div className="w-full ">
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex w-full"
      >
        <ResizablePanel defaultSize="50%">
          <div className="pl-10 text-ellipsis overflow-hidden text-nowrap">名前</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="10%">
          <div className="pl-1 text-ellipsis overflow-hidden text-nowrap">拡張子</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="10%">
          <div className="pl-1 text-ellipsis overflow-hidden text-nowrap">サイズ</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="10%">
          <div className="pl-1 text-ellipsis overflow-hidden text-nowrap">更新日時</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div >
  )
}
