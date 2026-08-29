import { ReactNode, useEffect, useRef } from 'react';

import { logic } from '@/lib/bindings-helper';
import { useTabStore } from '@/store/tab/store';

// TabState は localStrage から読み込んだ直後に tabs[].id === -1 になっているので、ここで初期化する
// ※ id は async 関数から取得するので、zustand の onRehydrateStorage の中では初期化できない
export function TabStateInitializer({ children }: { children: ReactNode }) {
  const tabs = useTabStore(state => state.tabs);
  const tabNotInitialized = 0 <= tabs.findIndex(tab => tab.id < 0);

  const initializing = useRef(false);
  useEffect(() => {
    const init = async () => {
      await logic.fixTabStore_from_FromLocalStrage();
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
