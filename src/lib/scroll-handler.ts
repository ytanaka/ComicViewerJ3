// <FileList>, <Thubmnails> のファイルリスト表示で、指定ファイルへスクロールさせたいときに使用する。

// ※ Virtuosoの部品を関数に渡して、関数の中で virtuoso.scrollToIndex(i) のようにスクロールさせたい。
//    しかし、画面部品には VirtuosoHandle, VirtuosoGridHandle などがあるので、呼び出し側でこのインターフェイスに変換してから渡すようにする。
export interface ScrollHandler {
  scroll: (fileIndex: number) => void;
}
