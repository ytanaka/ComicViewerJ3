import { commands } from '@/lib/bindings';
import { useUiState } from '@/store/ui-state';
import { ReactNode, useEffect } from 'react';

export function RustLibInitializer({ children }: { children: ReactNode }) {
  const appInitialized = useUiState(state => state.appInitialized);
  const setAppInitialized = useUiState(state => state.setAppInitialized);

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
