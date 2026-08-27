import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';

import { AppHotkey, AppMenuItem, menuItems } from '@/lib/menu-items';
import { useFocusState } from '@/store/focus-state';

function MyHotkey({ k }: { k: AppHotkey }) {
  return (
    <MenubarShortcut>
      <KbdGroup>
        {k.alt && (
          <>
            <Kbd>Alt</Kbd>
            <span>+</span>
          </>
        )}
        {k.shift && (
          <>
            <Kbd>Shift</Kbd>
            <span>+</span>
          </>
        )}
        {k.ctrl && (
          <>
            <Kbd>Ctrl</Kbd>
            <span>+</span>
          </>
        )}
        <Kbd>{k.key}</Kbd>
      </KbdGroup>
    </MenubarShortcut>
  );
}

function MyMenuItem({ m }: { m: AppMenuItem }) {
  return (
    <MenubarItem onClick={m.exec}>
      {m.value}
      {m.hotkey && <MyHotkey k={m.hotkey} />}
    </MenubarItem>
  );
}

export function Menu() {
  const setFocus = useFocusState(state => state.setFocus);

  return (
    <Menubar>
      <MenubarMenu onOpenChange={(open) => { if (!open) setFocus() }} >
        <MenubarTrigger >File</MenubarTrigger>
        <MenubarContent className="w-auto min-w-max">
          <MenubarGroup>
            <MyMenuItem m={menuItems.openDir} />
            <MyMenuItem m={menuItems.createEmptyFile} />
            <MyMenuItem m={menuItems.createDir} />
            <MyMenuItem m={menuItems.openFileProperty} />
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup>
            <MyMenuItem m={menuItems.exitApp} />
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent className="w-auto min-w-max">
          <MenubarGroup>
            <MyMenuItem m={menuItems.cutFile} />
            <MyMenuItem m={menuItems.copyFile} />
            <MyMenuItem m={menuItems.pasteFile} />
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup>
            <MyMenuItem m={menuItems.deleteFile} />
            <MyMenuItem m={menuItems.renameFile} />
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Tab</MenubarTrigger>
        <MenubarContent className="w-auto min-w-max">
          <MenubarGroup>
            <MyMenuItem m={menuItems.cloneTab} />
            <MyMenuItem m={menuItems.closeCurrentTab} />
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
