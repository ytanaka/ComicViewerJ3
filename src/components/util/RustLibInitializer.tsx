import { handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { ReactNode, useEffect, useRef } from 'react';

export function RustLibInitializer({ children }: { children: ReactNode }) {
  const appInitialized = useUiVolatileStore(state => state.appInitialized);
  const setAppInitialized = useUiVolatileStore(state => state.setAppInitialized);

  const initializing = useRef(false);
  useEffect(() => {
    const init = async () => {
      await rustcmds.init();
      await removeOldRustTabs();
      setAppInitialized();
      initializing.current = false;
    };
    if (!appInitialized && !initializing.current) {
      initializing.current = true;
      init();
    }
  }, [appInitialized, setAppInitialized]);

  if (!appInitialized) {
    return (
      <div className="h-screen w-screen flex justify-center items-center dark:text-white dark:bg-gray-800 text-black bg-gray-400">
        initializing ...
      </div>
    );
  } else {
    return children;
  }
}

async function removeOldRustTabs() {
  for (const tab of await rustcmds.getTabs()) {
    console.info(`remove unused old tab: ${tab.id}`);
    const result = await rustcmds.removeTab(tab.id);
    handleRustCmdResult(result, `rustcmds.removeTab(${tab.id})`, "古いタブ情報削除に失敗");
  }
}