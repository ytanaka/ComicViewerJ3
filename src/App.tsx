import './App.css';
import { Toaster, ToasterProps } from 'sonner';

import { Menu } from './components/Menu';
import { Toolbar } from './components/Toolbar';
import { useTheme } from 'next-themes';
import { TabBar } from './components/TabBar';
import { TabContent } from './components/TabContent';
import { useUIStore } from './store/ui-store';
import { useEffect, useRef } from 'react';
import { commands } from './lib/bindings';

function App() {
  const { resolvedTheme } = useTheme();

  const tabs = useUIStore(state => state.tabs);
  const setTab = useUIStore(state => state.setTab);
  const tabNotInitialized = (0 <= tabs.findIndex((tab) => tab.id === undefined));

  const initializing = useRef(false);
  useEffect(() => {
    const init = async () => {
      for (const tabId of await commands.getTabIds()) {
        console.log("<App> remove unused old tabId: ", tabId);
        await commands.removeTab(tabId);
      }

      for (let i = 0; i < tabs.length; i++) {
        const t = { ...tabs[i] };
        if (t.id === undefined) {
          t.id = await commands.createTab();
          setTab(i, t);
        }
      }
      initializing.current = false;
    }

    if (tabNotInitialized && !initializing.current) {
      initializing.current = true;
      init();
    }
  }, [setTab, tabNotInitialized, tabs])

  if (tabNotInitialized) {
    return (
      <div>initializing ...</div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-black dark:bg-black dark:text-white text-sm">
      <Menu></Menu>
      <Toolbar></Toolbar>
      <TabBar></TabBar>
      <TabContent />
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
