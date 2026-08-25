import { useRef } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable"

import { FileListHeaderN, useUiState } from "@/store/ui-state";

export function FileListHeader() {
  const sizes = useUiState(state => state.fileListHeaderSizes);
  const setFileListHeaderSize = useUiState(state => state.setFileListHeaderSizes);

  const ref0 = useRef<HTMLDivElement>(null);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const ref4 = useRef<HTMLDivElement>(null);

  function handleLayoutChanged() {
    const refList = [ref0.current, ref1.current, ref2.current, ref3.current, ref4.current];
    const sizes = refList.map((div) => {
      if (!div) return 10;
      return div.getBoundingClientRect().width
    });
    setFileListHeaderSize(sizes);
  }

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-900">
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex w-full"
        onLayoutChanged={handleLayoutChanged}
      >
        <ResizablePanel
          id={`${FileListHeaderN.Icon}`}
          className="box-border"
          defaultSize={sizes[FileListHeaderN.Icon]}
        >
          <div ref={ref0} className="pl-1 text-ellipsis overflow-hidden text-nowrap"></div>
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel
          id={`${FileListHeaderN.Name}`}
          className="box-border"
          defaultSize={sizes[FileListHeaderN.Name]}
        >
          <div ref={ref1} className="pl-1 text-ellipsis overflow-hidden text-nowrap">名前</div>
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel
          id={`${FileListHeaderN.Ext}`}
          className="box-border"
          defaultSize={sizes[FileListHeaderN.Ext]}
        >
          <div ref={ref2} className="pl-1 text-ellipsis overflow-hidden text-nowrap">拡張子</div>
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel
          id={`${FileListHeaderN.Size}`}
          className="box-border"
          defaultSize={sizes[FileListHeaderN.Size]}
        >
          <div ref={ref3} className="pl-1 text-ellipsis overflow-hidden text-nowrap">サイズ</div>
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel
          id={`${FileListHeaderN.Date}`}
          className="box-border"
          defaultSize={sizes[FileListHeaderN.Date]}
        >
          <div ref={ref4} className="pl-1 text-ellipsis overflow-hidden text-nowrap">更新日時</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div >
  )
}
