import './App.css';
import { Toaster, ToasterProps } from 'sonner';

import { Menu } from './components/Menu';
import { Toolbar } from './components/Toolbar';
import { useTheme } from 'next-themes';
import { TabBar } from './components/TabBar';
import { TabContent } from './components/TabContent';

function App() {
  const { resolvedTheme } = useTheme();

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
