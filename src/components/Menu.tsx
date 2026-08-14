import { commands } from '@/lib/bindings';
import { Kbd, KbdGroup } from './ui/kbd';
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from './ui/menubar';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function Menu() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent className="w-auto min-w-max">
          <MenubarGroup>
            <MenubarItem>
              ディレクトリを開く
              <MenubarShortcut>
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <span>+</span>
                  <Kbd>O</Kbd>
                </KbdGroup>
              </MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              ファイル作成
              <MenubarShortcut>
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <span>+</span>
                  <Kbd>F</Kbd>
                </KbdGroup>
              </MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              ディレクトリ作成
              <MenubarShortcut>
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <span>+</span>
                  <Kbd>K</Kbd>
                </KbdGroup>
              </MenubarShortcut>
            </MenubarItem>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup>
            <MenubarItem
              onClick={async () => {
                const window = getCurrentWindow();
                await window.close();
                commands.exitApp();
              }}
            >
              終了
              <MenubarShortcut>
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <span>+</span>
                  <Kbd>Q</Kbd>
                </KbdGroup>
              </MenubarShortcut>
            </MenubarItem>
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  );
}
