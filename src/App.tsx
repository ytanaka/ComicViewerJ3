import './App.css';
import FileList from './components/file-list/FileList';
import { Menu } from './components/Menu';

function App() {
  return (
    <div className="flex flex-col bg-white text-black dark:bg-black dark:text-white text-sm">
      <Menu></Menu>
      <FileList></FileList>
    </div>
  );
}

export default App;
