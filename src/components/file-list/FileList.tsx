import { ReactNode, useEffect, useRef } from 'react';
import { ItemProps, ListRange, TableProps, TableVirtuoso, VirtuosoHandle } from 'react-virtuoso';

import { basename as tauri_basename, dirname as tauri_dirname } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { FileListHeader } from './FileListHeader';
import { FileListRow } from './FileListRow';
import { useTabStore } from '@/store/tab/store';
import { logic } from '@/lib/bindings-helper';
import { errToStr } from '@/lib/string-util';
import { fileSearchInput_handleKeyDown } from '@/lib/event-handler/file-search-input-key-handler';
import { tabFiles_handleKeyDown } from '@/lib/event-handler/tab-files-key-handler';
import { useUiStore } from '@/store/ui-store';

function st() {
  return useTabStore.getState();
}

export default function FileList() {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const currentTabIndex = useTabStore(state => state.currentTabIndex);
  const tab = useTabStore(state => state.getCurrentTab());
  const dirEntries = tab.dirEntries;

  console.debug(`<FileList> tab[${currentTabIndex}](id:${tab.id})`);

  // データ取得
  useEffect(() => {
    const read = async () => {
      if (tab.dirEntries == undefined && tab.errorMsg == undefined) {
        await logic.readDirEntries(tab.id);
      }
    };
    read();
  }, [tab.dirEntries, tab.errorMsg, tab.id]);

  // 親ディレクトリに移動したときに現在ディレクトリが選択されてほしいので、履歴に追加しておく
  useEffect(() => {
    const setHist = async () => {
      try {
        const parent = await tauri_dirname(tab.path);
        if (!st().findHistory(tab.id, parent)) {
          const base = await tauri_basename(tab.path);
          st().pushHistory(tab.id, parent, base);
        }
      } catch (e) {
        console.debug(`<FileList> setHist() error path=${tab.path}`, errToStr(e));
      }
    };
    setHist();
  }, [tab.id, tab.path]); // 初回だけ実行する

  // タイトルバー更新
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tab.path);
    };
    setTitle();
  }, [tab.path]);

  // スクロール位置検知
  const visibleListRange = useRef(1);
  const handleRangeChanged = (range: ListRange) => {
    // スクロール位置が変化したら、表示する範囲のファイル情報を取得する
    visibleListRange.current = Math.max(1, range.endIndex - range.startIndex);

    // ファイル情報読み込み
    logic.readFileInfos(tab.id, range.startIndex, range.endIndex);
  };

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (virtuoso.current === null) return;
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      if (100 < delay) {
        console.info('ignore keyboard event');
        return;
      }

      // ファイル検索テキスト入力
      if (fileSearchInput_handleKeyDown(e, virtuoso.current)) {
        return;
      }

      if (tabFiles_handleKeyDown(e, tab, visibleListRange.current, virtuoso.current)) {
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // 初回だけ実行する

  const fileListHeaderSizes = useUiStore(state => state.fileListHeaderSizes);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        {dirEntries === undefined ? (
          <div>更新中</div>
        ) : (
          <TableVirtuoso
            ref={virtuoso}
            components={{
              TableRow: (props: ItemProps<ReactNode>) => (
                <FileListRow
                  tab={tab}
                  fileIndex={props['data-index']}
                  dirEntry={dirEntries[props['data-index']]}
                  {...props}
                />
              ),
              Table: ({ children, ...props }: TableProps) => (
                <table {...props} className="w-full" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: fileListHeaderSizes[0] }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: fileListHeaderSizes[2] }} />
                    <col style={{ width: fileListHeaderSizes[3] }} />
                    <col style={{ width: fileListHeaderSizes[4] }} />
                  </colgroup>
                  {children}
                </table>
              ),
            }}
            initialTopMostItemIndex={{ index: st().getSelection(tab.id).focusIndex, align: 'center' }}
            fixedHeaderContent={FileListHeader}
            totalCount={dirEntries.length}
            rangeChanged={handleRangeChanged}
          />
        )}
      </div>
    </div>
  );
}
