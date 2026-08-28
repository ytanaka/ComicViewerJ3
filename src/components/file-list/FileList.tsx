import { useEffect, useRef } from 'react';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import {
  TabFilesDirWalkerKeyHandler,
  TabFilesSelectionKeyHandler,
} from '@/lib/tab-files-key-handler';
import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { basename as tauri_basename, dirname as tauri_dirname } from '@tauri-apps/api/path';
import { ScrollLevel, useScrollToFocusState } from '@/store/scroll-to-focus-state';
import { useTabStore } from '@/store/tab/store';
import { logic } from '@/lib/bindings-helper';

function st() { return useTabStore.getState(); }

export default function FileList() {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const currentTabIndex = useTabStore(state => state.currentTabIndex);
  const tab = useTabStore(state => state.getCurrentTab());

  console.debug(`<FileList> tab[${currentTabIndex}](id:${tab.id})`);

  // データ取得
  useEffect(() => {
    const read = async () => {
      if (tab.dirEntries == undefined && tab.errorMsg == undefined) {
        await logic.readDirEntries(tab.id);
      }
    }
    read();
  }, [tab.dirEntries, tab.errorMsg, tab.id])

  // 親ディレクトリに移動したときに現在ディレクトリが選択されてほしいので、履歴に追加しておく
  useEffect(() => {
    const setHist = async () => {
      const parent = await tauri_dirname(tab.path);
      if (!st().findHistory(tab.id, parent)) {
        const base = await tauri_basename(tab.path);
        st().pushHistory(tab.id, parent, base);
      }
    };
    setHist();
  }, [tab.id, tab.path]); // 初回だけ実行する

  // タイトルバー設定
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tab.path);
    };
    setTitle();
  }, [tab.path]);

  // スクロール位置検知
  const visibleListRange = useRef(1);
  const handleRangeChanged = (range: ListRange) => {
    visibleListRange.current = Math.max(1, range.endIndex - range.startIndex);
  };

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      if (100 < delay) {
        console.info('ignore keyboard event');
        return;
      }

      // console.debug('key ', e);

      const keyHandler = new TabFilesSelectionKeyHandler(tab, visibleListRange.current - 1); // ヘッダーがあるので -1
      if (keyHandler.handleKey(e)) return;

      const keyHandlerDir = new TabFilesDirWalkerKeyHandler(tab);
      if (keyHandlerDir.handleKey(e)) return;
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // 初回だけ実行する

  // スクロール位置調整
  const scrollLevel = useScrollToFocusState(state => state.scrollLevel);
  const setScroll = useScrollToFocusState(state => state.setScroll);
  useEffect(() => {
    if (scrollLevel !== ScrollLevel.No) {
      function scr() {
        const tab = st().getCurrentTab();
        virtuoso.current?.scrollIntoView({
          index: st().getSelection(tab.id).focusIndex + 1, // ヘッダーがあるので +1
        });
      }

      scr();
      if (scrollLevel === ScrollLevel.Lazy) {
        // 親ディレクトリに移動したときにうまくスクロールしないので遅延させる
        setTimeout(() => scr(), 100);
      }
      setScroll(ScrollLevel.No);
    }
  }, [scrollLevel, setScroll]); // スクロールが指示されたら実行する

  const dirEntries = tab.dirEntries;
  // console.debug(`<FileList> dirEntries: [${dirEntries?.length}]`)

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        {dirEntries === undefined ? (
          <div>更新中</div>
        ) : (
          <Virtuoso
            ref={virtuoso}
            key={`${tab.id}`} // タブ変更時に内部状態をリセットしないと、古い情報で子コンポーネントが描画されてしまう https://github.com/petyosi/react-virtuoso/issues/1396
            data={[null, ...dirEntries]}
            totalCount={dirEntries.length + 1}
            topItemCount={1}
            rangeChanged={handleRangeChanged}
            itemContent={(index, data) => {
              if (data === null) {
                return <FileListHeader />;
              } else {
                const fileIndex = index - 1;
                return (
                  <FileListRow
                    tab={tab}
                    fileIndex={fileIndex}
                    dirEntry={data}
                  />
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
