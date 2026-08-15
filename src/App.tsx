import './App.css';
import FileList from './components/file-list/FileList';
import { Menu } from './components/Menu';
import { Toolbar } from './components/Toolbar';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-white text-black dark:bg-black dark:text-white text-sm">
      <Menu></Menu>
      <Toolbar></Toolbar>
      <FileList className="flex-1"></FileList>
    </div>
  );
}

export default App;
