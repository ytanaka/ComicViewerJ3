import { commands } from '@/lib/bindings';
import { useUiStore } from '@/store/ui-store';
import { ReactNode, useEffect } from 'react';

export function RustLibInitializer({ children }: { children: ReactNode }) {
  const appInitialized = useUiStore(state => state.appInitialized);
  const setAppInitialized = useUiStore(state => state.setAppInitialized);

  useEffect(() => {
    const init = async () => {
      await commands.init();
      setAppInitialized();
    };
    if (!appInitialized) init();
  }, [appInitialized, setAppInitialized]);

  if (!appInitialized) {
    return <div>initializing ...</div>;
  } else {
    return children;
  }
}
