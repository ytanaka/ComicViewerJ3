import './App.css';
import { Toaster, ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from './components/util/ErrorFallback';
import { Menu } from './components/misc/Menu';
import { Toolbar } from './components/misc/Toolbar';
import { TabContentWrapper } from './components/tab/TabContent';
import { HotKeys } from './components/util/HotKeys';
import { TabBar } from './components/tab/TabBar';
import { StatusBar } from './components/misc/StatusBar';
import { PreferencesDialog } from './components/preferences/PreferencesDialog';
import { BookmarkManager } from './components/bookmark/BookmarkManager';
import { TauriEventListener } from './lib/tauri-event-listener';
import { useUiStore } from './store/ui-store';

function App() {
  const { resolvedTheme } = useTheme();
  const fontFamily = useUiStore(state => state.fontFamily);
  const fontSize = useUiStore(state => state.fontSize);

  console.debug('<App>');

  return (
    <div
      className="h-screen w-screen flex flex-col bg-white text-black dark:bg-black dark:text-white text-sm"
      style={{ fontFamily: fontFamily, fontSize: 0 < fontSize ? fontSize : undefined }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <HotKeys />
        <Menu />
        <Toolbar />
        <TabBar />
        <TabContentWrapper />
        <StatusBar />
        <PreferencesDialog />
        <BookmarkManager />
        <TauriEventListener />
        <Toaster
          position="bottom-right"
          expand={false}
          duration={2000}
          visibleToasts={5}
          theme={resolvedTheme as ToasterProps['theme']}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;
