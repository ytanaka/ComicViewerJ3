import { searchCommands } from "@/lib/commands/search-commands";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useSearchResultStore } from "@/store/file-search-result-store";
import { useSearchTextStore } from "@/store/file-search-text-store";
import { TabInfo } from "@/store/tab/types";
import React, { useEffect, useState } from "react";
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

  let msg;
  if (isProgress) {
    msg = `検索中・・・: ${romaji}`;
  } else if (!result) {
    return (<></>);
  } else {
    if (result.type === 'Success') {
      msg = `${romaji}: ${result.match_str}`;
    } else if (result.type === 'FailNoCache') {
      msg = "まだ検索できません：ファイル名の解析中";
    } else {
      msg = "見つかりません " + romaji;
    }
  }

  return (
    <Popover open={true}>
      <PopoverTrigger nativeButton={false} render={<div />} />
      <PopoverContent className="w-fit border-2" onKeyDown={(e) => handleKeyDown(e)}>
        {msg}
      </PopoverContent>
    </Popover>
  )
}
