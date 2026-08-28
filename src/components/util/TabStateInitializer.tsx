import { commands } from '@/lib/bindings';
import { useTabStore } from '@/store/tab/store';
import { FileFocusHistory } from '@/store/tab/types';
import { ReactNode, useEffect, useRef } from 'react';

// TabState は localStrage から読み込んだ直後に tabs[].id === -1 になっているので、ここで初期化する
// ※ id は async 関数から取得するので、zustand の onRehydrateStorage の中では初期化できない
export function TabStateInitializer({ children }: { children: ReactNode }) {
  const tabs = useTabStore(state => state.tabs);
  const tabNotInitialized = 0 <= tabs.findIndex(tab => tab.id < 0);

  const initializing = useRef(false);
  useEffect(() => {
    const init = async () => {
      const tabs = useTabStore.getState().tabs;

      for (const tabId of await commands.getTabIds()) {
        console.info('<TabStateInitializer> remove unused old tabId: ', tabId);
        await commands.removeTab(tabId);
      }

      // タブIDは store から復元時に負数に変換してあるので、tabs[].id と focusHistories[tabId] を新しいタブIDに作り直す
      const oldHist = useTabStore.getState().focusHistories;
      const newHist: Record<number, FileFocusHistory> = {};
      for (let i = 0; i < tabs.length; i++) {
        // 新規タブID発行
        const oldId = tabs[i].id;
        const newId = await commands.createTab();
        tabs[i].id = newId;

        // focusHistories 再構築
        const hist = oldHist[oldId];
        if (hist !== undefined) {
          newHist[newId] = hist;
        }
      }
      console.log("<TabStateInitializer> new tabs: ", JSON.stringify(tabs));
      console.log("<TabStateInitializer> new hist: ", JSON.stringify(newHist));
      useTabStore.getState().initTabs(tabs, newHist);

      initializing.current = false;
    };

    if (tabNotInitialized && !initializing.current) {
      initializing.current = true;
      init();
    }
  }, [tabNotInitialized, tabs]);

  // console.debug(`<TabStateInitializer> tabIds=${tabs.map(t => t.id)}`);

  if (tabNotInitialized) {
    return <div>initializing ...</div>;
  } else {
    return children;
  }
}
