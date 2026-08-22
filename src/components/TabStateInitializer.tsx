import { commands } from '@/lib/bindings';
import { useTabState } from '@/store/tab-state';
import { ReactNode, useEffect, useRef } from 'react';

// TabState は localStrage から読み込んだ直後に tabs[].id === undefined になっているので、ここで初期化する
// ※ id は async 関数から取得するので、zustand の onRehydrateStorage の中では初期化できない
export function TabStateInitializer({ children }: { children: ReactNode }) {
  const tabs = useTabState(state => state.tabs);
  const updateTab = useTabState(state => state.updateTab);
  const tabNotInitialized = 0 <= tabs.findIndex(tab => tab.id === undefined);

  const initializing = useRef(false);
  useEffect(() => {
    const init = async () => {
      for (const tabId of await commands.getTabIds()) {
        console.log('<App> remove unused old tabId: ', tabId);
        await commands.removeTab(tabId);
      }

      for (let i = 0; i < tabs.length; i++) {
        const t = { ...tabs[i] };
        if (t.id === undefined) {
          t.id = await commands.createTab();
          updateTab(i, t);
        }
      }
      initializing.current = false;
    };

    if (tabNotInitialized && !initializing.current) {
      initializing.current = true;
      init();
    }
  }, [updateTab, tabNotInitialized, tabs]);

  if (tabNotInitialized) {
    return <div>initializing ...</div>;
  } else {
    return children;
  }
}
