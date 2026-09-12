import './App.css';
import { Toaster, ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from './components/util/ErrorFallback';
import { Menu } from './components/misc/Menu';
import { Toolbar } from './components/misc/Toolbar';
import { TabContentWrapper } from './components/misc/TabContent';
import { HotKeys } from './components/util/HotKeys';
import { TabBar } from './components/misc/TabBar';
import { StatusBar } from './components/misc/StatusBar';
import { PreferencesDialog } from './components/preferences/PreferencesDialog';

function App() {
  const { resolvedTheme } = useTheme();

  console.debug('<App>');

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-black dark:bg-black dark:text-white text-sm">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <HotKeys />
        <Menu />
        <Toolbar />
        <TabBar />
        <TabContentWrapper />
        <StatusBar />
        <PreferencesDialog />
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

// Tauriイベントリスナー初期化
import './lib/event-listener';
