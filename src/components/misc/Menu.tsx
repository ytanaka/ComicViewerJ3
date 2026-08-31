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
import { useFocusStore } from '@/store/focus-store';
import { useEffect, useState } from 'react';

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
  const setFocus = useFocusStore(state => state.setFocus);

  function handleOpenChange(open: boolean) {
    if (!open) setFocus();
  }

  const [openF, setOpenF] = useState(false);
  const [openE, setOpenE] = useState(false);
  const [openT, setOpenT] = useState(false);

  useEffect(() => {
    const keyList = ['f', 'e', 't'];
    const setOpenList = [setOpenF, setOpenE, setOpenT];
    const handler = (e: KeyboardEvent) => {
      for (let i = 0; i < keyList.length; i++) {
        if (e.altKey && e.key.toLowerCase() === keyList[i]) {
          e.preventDefault();
          setOpenList[i](true);
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, []);

  return (
    <Menubar>
      <MenubarMenu open={openF} onOpenChange={(b) => { handleOpenChange(b); setOpenF(b); }}>
        <MenubarTrigger><u>F</u>ile</MenubarTrigger>
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
      <MenubarMenu open={openE} onOpenChange={(b) => { handleOpenChange(b); setOpenE(b); }}>
        <MenubarTrigger><u>E</u>dit</MenubarTrigger>
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
          <MenubarSeparator />
          <MenubarGroup>
            <MyMenuItem m={menuItems.preference} />
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu open={openT} onOpenChange={(b) => { handleOpenChange(b); setOpenT(b); }}>
        <MenubarTrigger><u>T</u>ab</MenubarTrigger>
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
