import { tabCommands } from './commands/tab-commands';
import { windowCommands } from './commands/window-commands';

type MenuExec = () => Promise<void> | void;

export interface AppMenuItem {
  value: string;
  exec: MenuExec;
  hotkey?: AppHotkey;
}

function M(value: string, exec: MenuExec, hotkey?: string): AppMenuItem {
  return {
    value,
    exec,
    hotkey: hotkey !== undefined ? new AppHotkey(hotkey) : undefined,
  };
}

export class AppHotkey {
  ctrl: boolean = false;
  alt: boolean = false;
  shift: boolean = false;
  key: string;

  constructor(s: string) {
    const spl = s.split('+');
    const [key] = spl.splice(spl.length - 1, 1);
    this.key = key.toLowerCase();
    spl.forEach(mod => {
      switch (mod.toLowerCase()) {
        case 'shift':
          this.shift = true;
          break;
        case 'ctrl':
          this.ctrl = true;
          break;
        case 'alt':
          this.alt = true;
          break;
        default:
          throw new Error(`invalid hotkey: ${s}`);
      }
    });
  }
}

export const menuItems = {
  exitApp: M('終了', () => windowCommands.exitApp(), 'Ctrl+Q'),

  openDir: M('ディレクトリを開く', () => windowCommands.openDirectory(), 'Ctrl+O'),
  createEmptyFile: M('ファイル作成', () => console.log('CREATE FILE!!!'), 'Ctrl+F'),
  createDir: M('ディレクトリ作成', () => console.log('CREATE DIR!!!'), 'Ctrl+K'),
  openFileProperty: M('プロパティ', () => console.log('CREATE DIR!!!'), 'Alt+Enter'),

  copyFile: M('コピー', () => console.log('COPY!!!'), 'Ctrl+C'),
  cutFile: M('切り取り', () => console.log('CUT!!!'), 'Ctrl+X'),
  pasteFile: M('貼り付け', () => console.log('PASTE!!!'), 'Ctrl+V'),
  deleteFile: M('削除', () => console.log('DEL!!!'), 'Delete'),
  renameFile: M('名前変更', () => console.log('RENAME!!!'), 'F2'),

  cloneTab: M('タブを開く', () => tabCommands.cloneCurrentTab(), 'Ctrl+T'),
  closeCurrentTab: M('タブを閉じる', () => tabCommands.removeCurrentTab(), 'Ctrl+W'),
  nextTab: M('次のタブ', () => tabCommands.setCurrentTabNextPrev(1), 'Ctrl+PageDown'),
  prevTab: M('前のタブ', () => tabCommands.setCurrentTabNextPrev(-1), 'Ctrl+PageUp'),
};

export function getAllMenuItems() {
  return Object.values(menuItems);
}
