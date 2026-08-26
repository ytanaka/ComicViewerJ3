import './App.css';
import { Toaster, ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';

import { Menu } from './components/misc/Menu';
import { Toolbar } from './components/misc/Toolbar';
import { TabContent } from './components/misc/TabContent';
import { HotKeys } from './components/util/HotKeys';
import { TabBar } from './components/misc/TabBar';
import { StatusBar } from './components/misc/StatusBar';

function App() {
  const { resolvedTheme } = useTheme();

  console.debug('<App>');

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-black dark:bg-black dark:text-white text-sm">
      <HotKeys />
      <Menu />
      <Toolbar />
      <TabBar />
      <TabContent />
      <StatusBar />
      <Toaster
        position="bottom-right"
        expand={false}
        duration={2000}
        visibleToasts={5}
        theme={resolvedTheme as ToasterProps['theme']}
      />
    </div>
  );
}

export default App;
