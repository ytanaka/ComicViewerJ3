import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useSearchResultStore } from "@/store/file-search-result-store";
import { useSearchTextStore } from "@/store/file-search-text-store";
import { TabInfo } from "@/store/tab/types";

export function SearchResult({ tab }: { tab: TabInfo }) {
  const result = useSearchResultStore(state => state.getResult(tab));
  const romaji = useSearchTextStore(state => state.text);

  let msg;
  if (result === null) {
    return (<></>);
  } else if (result.type === 'Success') {
    msg = `${romaji}: ${result.match_str}`;
  } else if (result.type === 'FailNoCache') {
    msg = "まだ検索できません：ファイル名の解析中";
  } else {
    msg = "見つかりません " + romaji;
  }

  return (
    <Popover open={true}>
      <PopoverTrigger nativeButton={false} render={<div />} />
      <PopoverContent className="w-fit border-2">
        {msg}
      </PopoverContent>
    </Popover>
  )
}
