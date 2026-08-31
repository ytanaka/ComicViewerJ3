import { commands } from '@/lib/bindings';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { ReactNode, useEffect } from 'react';

export function RustLibInitializer({ children }: { children: ReactNode }) {
  const appInitialized = useUiVolatileStore(state => state.appInitialized);
  const setAppInitialized = useUiVolatileStore(state => state.setAppInitialized);

  useEffect(() => {
    const init = async () => {
      await commands.init();
      setAppInitialized();
    };
    if (!appInitialized) init();
  }, [appInitialized, setAppInitialized]);

  if (!appInitialized) {
    return <div className='h-screen w-screen flex justify-center items-center dark:text-white dark:bg-gray-800 text-black bg-gray-400'>initializing ...</div>;
  } else {
    return children;
  }
}
