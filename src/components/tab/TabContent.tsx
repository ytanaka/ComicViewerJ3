import { useEffect, useRef } from 'react';

import { basename as tauri_basename, dirname as tauri_dirname } from '@tauri-apps/api/path';

import FileList from '@/components/tab/list-view/FileList';
import { useFocusStore } from '@/store/focus-store';
import { useTabStore } from '@/store/tab/store';
import { FileViewMode } from '@/store/tab/types';
import { Thumbnails } from './thumbnail-view/Thumbnails';
import { useCmdCreateTab } from '@/services/tab';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useCmdGetDirEntries } from '@/services/tab-dir-entry';
import { useUiStore } from '@/store/ui-store';
import { fileSearchInput_handleKeyDown } from '@/lib/event-handler/file-search-input-key-handler';
import { tabFiles_handleKeyDown } from '@/lib/event-handler/tab-files-key-handler';
import { ImageView } from './image-view/ImageView';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { windowCommands } from '@/lib/commands/window-commands';
import { isPictureFileExtension } from '@/lib/tools/string-util';

function st() {
  return useTabStore.getState();
}

// タブ内のコンテンツ
// (タブバーとステータスバーの間の領域)
// (タブ数が０の場合もありうる)
//
// <FileList>, <Thumbnails> の共通機能をここで実装する
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
    <div ref={ref} tabIndex={0} style={{ outline: 'none' }} className="flex-1 select-none min-h-0">
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
  useTabStore(state => state.getCurrentTab()?.refreshCount); // ソート状態が変わったら再レンダーする

  const fileViewMode = useTabStore(state => state.getCurrentTab()?.fileViewMode);
  const imageView = useTabStore(state => state.getCurrentTab()?.imageViewMode.enable) ?? false;
  const full = useUiVolatileStore(state => state.isFullscreen);
  const shouldFull = useUiVolatileStore(state => state.shouldFullscreenWhenImageView);

  console.debug(`<TabContent> tab[${currentTabIndex}](id:${tab.id}), ${tab.path}`);

  // フルスクリーン制御
  useEffect(() => {
    if (full) {
      if (!imageView) {
        windowCommands.setFullscreen(false);
      }
    } else {
      if (imageView && shouldFull) {
        windowCommands.setFullscreen(true);
      }
    }
  }, [full, imageView, shouldFull]);

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
        const base = await tauri_basename(tab.path);
        st().pushHistory(tab.id, parent, base);
      } catch {
        // 現ディレクトリに親ディレクトリがない場合は例外が発生するので無視する
      }
    };
    setHist();
  }, [tab.id, tab.path]); // 初回表示時だけ実行する

  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 遅延が発生していたらイベントを無視
      const delay = performance.now() - e.timeStamp;
      const timeout = useUiStore.getState().timeoutMsEventTimeStamp;
      if (0 < timeout && timeout < delay) {
        console.info('ignore keyboard event');
        return;
      }

      // ファイル検索テキスト入力
      if (!st().getCurrentTab()?.imageViewMode.enable && fileSearchInput_handleKeyDown(e)) {
        return;
      }

      if (tabFiles_handleKeyDown(e)) {
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // 初回だけ実行する

  // サムネイルモードで子ディレクトリに移動して画像ファイルにフォーカスがあったら、画像表示モードにする
  useEffect(() => {
    if (!dirEntries) return;

    // ディレクトリ移動後、１回だけ実行する
    if (useTabStore.getState().getCurrentTab()?.justDirMoved != true) return;
    useTabStore.getState().clearJustDirMoved(tab.id);

    if (fileViewMode != FileViewMode.Thumbnail) return;
    if (imageView) return;
    const focus = useTabStore.getState().getCurrentTab()?.selection.focusIndex;
    if (focus === undefined) return;
    const dirEntry = dirEntries[focus];
    if (dirEntry.is_dir) return;
    if (!isPictureFileExtension(dirEntry.name)) return;

    useTabStore.getState().setImageView(tab.id, true);
  });

  const ret = imageView ? (
    <ImageView dirEntries={dirEntries} />
  ) : fileViewMode === FileViewMode.Thumbnail ? (
    <Thumbnails dirEntries={dirEntries} />
  ) : (
    <FileList dirEntries={dirEntries} />
  );

  // ↓ なんでこんな変なことをしているのか・・・
  //
  // タブに <ListView> を並べて Ctrl+PageUp でタブ切り替えをすると、切替後のタブでフォーカス位置までスクロールしてくれない。
  // <ListView> と <Thumbnails> の間をタブ切り替えすると、スクロールしてくれる。
  // <ListView> でも、親ディレクトリや子ディレクトリへの移動はスクロールしてくれる。(フォーカス履歴の位置復元機能)
  //
  // DirEntries がすでに存在する <ListView> どうしでタブ切り替えすると以前の状態がうまくクリアされない？
  // Virtuosoライブラリの使い方が悪いのか、ライブラリが悪いのかわからない。
  // DOMの状態が変わるとうまくスクロールしてくれるみたいなので、タブの状態が変わるたびに <div> を挿入してみる。
  const gen = useTabStore(state => state.generation) % 2;
  if (gen == 0) {
    return ret;
  } else {
    return <div className="h-full w-full">{ret}</div>;
  }
}
