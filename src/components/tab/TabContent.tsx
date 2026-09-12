import { useEffect, useRef } from 'react';

import { basename as tauri_basename, dirname as tauri_dirname } from '@tauri-apps/api/path';

import FileList from '@/components/tab/file-list/FileList';
import { useFocusStore } from '@/store/focus-store';
import { useTabStore } from '@/store/tab/store';
import { FileViewMode } from '@/store/tab/types';
import { Thumbnails } from './thumbnails/Thumbnails';
import { useCmdCreateTab, useCmdGetDirEntries } from '@/services/files';
import { getCurrentWindow } from '@tauri-apps/api/window';

function st() {
  return useTabStore.getState();
}

// タブ内のコンテンツ
// (タブバーとステータスバーの間の領域)
// (タブ数が０の場合もありうる)
export function TabContentWrapper() {
  const ref = useRef<HTMLDivElement>(null);
  const getFocus = useFocusStore(state => state.getFocus);
  const doneFocus = useFocusStore(state => state.doneFocus);

  useEffect(() => {
    if (getFocus && ref.current) {
      ref.current.focus();
      doneFocus();
    }
  }, [getFocus, doneFocus]);

  const tabsLength = useTabStore(state => state.tabs.length);

  return (
    <div ref={ref} tabIndex={0} style={{ outline: 'none' }} className="flex flex-1 select-none">
      {tabsLength === 0 ? (
        // タブがない場合
        <div className="w-full h-full justify-center items-center text-xl">No Tabs</div>
      ) : (
        // タブが1つ以上ある場合
        <TabContent />
      )}
    </div>
  );
}

// タブが１つ以上ある場合にここに来る
function TabContent() {
  const tab = useTabStore(state => state.getCurrentTab()?.info)!; // このコンポーネントが呼ばれているということは、タブはあるはず
  const currentTabIndex = useTabStore(state => state.currentTabIndex);

  console.debug(`<TabContent> tab[${currentTabIndex}](id:${tab.id}), ${tab.path}`);

  // タブ情報作成
  useCmdCreateTab(tab);
  // ファイル一覧取得
  const { data: dirEntries } = useCmdGetDirEntries(tab);

  // タイトルバー更新
  useEffect(() => {
    const setTitle = async () => {
      await getCurrentWindow().setTitle(tab.path);
    };
    setTitle();
  }, [tab.path]);

  // 親ディレクトリに移動したときに現在ディレクトリが選択されてほしいので、履歴に追加しておく
  useEffect(() => {
    const setHist = async () => {
      try {
        const parent = await tauri_dirname(tab.path);
        if (!st().findHistory(tab.id, parent)) {
          const base = await tauri_basename(tab.path);
          st().pushHistory(tab.id, parent, base);
        }
      } catch {
        // 現ディレクトリに親ディレクトリがない場合は例外が発生するので無視する
      }
    };
    setHist();
  }, [tab.id, tab.path]); // 初回表示時だけ実行する

  const fileViewMode = useTabStore(state => state.getCurrentTab()?.fileViewMode);

  return (
    fileViewMode === FileViewMode.Thumbnail ? (
      <Thumbnails dirEntries={dirEntries} />
    ) : (
      <FileList dirEntries={dirEntries} />
    )
  )
}
