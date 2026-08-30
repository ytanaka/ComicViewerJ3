import React, { ReactNode, useEffect, useState } from "react";
import { CircleCheckBig, CircleX, LoaderCircle } from "lucide-react";

import { searchCommands } from "@/lib/commands/search-commands";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useSearchResultStore } from "@/store/file-search-result-store";
import { useSearchTextStore } from "@/store/file-search-text-store";
import { TabInfo } from "@/store/tab/types";
import { BaseUIEvent } from "@base-ui/react";

export function SearchResult({ tab }: { tab: TabInfo }) {
  const romaji = useSearchTextStore(state => state.text);
  const result = useSearchResultStore(state => state.getResult(tab));
  const isProgress = useSearchResultStore(state => state.isProgress(tab));

  // 一定時間経過で消えるようにする (useSearchResultStore の値は変化しないので useState を使う)
  const [, setRefresh] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefresh(state => state + 1);
    }, 300);
    return () => clearTimeout(timer);
  });

  // Popover 表示中は Esc が Popover 内部で消費されてしまうので、ここで処理する
  function handleKeyDown(e: BaseUIEvent<React.KeyboardEvent<HTMLDivElement>>) {
    if (e.key === 'Escape') searchCommands.cancel();
  }

  const iconSize = 14;
  let child: ReactNode;
  if (isProgress) {
    // ------------------- 検索中 -------------------
    child = (<div>
      <div className="flex items-center">
        <LoaderCircle size={iconSize} className="animate-spin" />
        <span className="pl-2 font-light text-sm">検索中...</span>
      </div>
      <div>
        <span className="pl-2">{romaji}</span>
      </div>
    </div>);
  } else if (!result) {
    // ------------------- 非表示 -------------------
    return (<></>);
  } else {
    if (result.type === 'Success') {
      // ------------------- 発見 -------------------
      child = (<div>
        <div className="flex items-center">
          <CircleCheckBig size={iconSize} />
          <span className="pl-1 text-xs font-light">{romaji}</span>
        </div>
        <div>
          <span className="pl-2">{result.match_str}</span>
        </div>
      </div>);
    } else if (result.type === 'FailNoCache') {
      // ------------------- 解析中 -------------------
      child = (<div >
        <div className="flex items-center">
          <LoaderCircle size={iconSize} className="animate-spin" />
          <div className="pl-1 font-light text-sm">まだ検索できません</div>
        </div>
        <div>ファイル名の解析中</div>
      </div>);
    } else {
      // ------------------- 見つからない -------------------
      child = (<div>
        <div className="flex items-center">
          <CircleX size={iconSize} />
          <span className="pl-1 font-light text-sm">見つかりません</span>
        </div>
        <div className="pl-2">{romaji}</div>
      </div>);
    }
  }

  return (
    <Popover open={true}>
      <PopoverTrigger nativeButton={false} render={<div />} />
      <PopoverContent className="w-fit border-2" onKeyDown={(e) => handleKeyDown(e)}>
        {child}
      </PopoverContent>
    </Popover>
  )
}
