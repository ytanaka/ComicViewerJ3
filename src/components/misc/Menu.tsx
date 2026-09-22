import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';

import { AppHotkey, AppMenuItem, menuItems } from '@/lib/menu-items';
import { useFocusStore } from '@/store/focus-store';
import { useUiVolatileStore } from '@/store/ui-volatile-store';

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
        <Kbd>{getDisplayKeyString(k.key)}</Kbd>
      </KbdGroup>
    </MenubarShortcut>
  );
}
function getDisplayKeyString(key: string) {
  switch (key) {
    case 'arrowright':
      return '→';
    case 'arrowleft':
      return '←';
    case 'arrowup':
      return '↑';
    case 'arrowdown':
      return '↓';
  }
  return key.toUpperCase();
}

function MyMenuItem({ m }: { m: AppMenuItem }) {
  const enabled = m.checkEnabledFn == undefined || m.checkEnabledFn();
  return (
    <MenubarItem disabled={!enabled} onClick={m.exec}>
      {m.value}
      {m.hotkey && <MyHotkey k={m.hotkey} />}
    </MenubarItem>
  );
}

export function Menu() {
  const setFocus = useFocusStore(state => state.setFocus);
  const full = useUiVolatileStore(state => state.isFullscreen);

  function handleOpenChange(open: boolean) {
    if (!open) setFocus();
  }

  return (
    <Menubar hidden={full} style={{ display: full ? 'none' : undefined }}>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MenubarMenu onOpenChange={handleOpenChange}>
        <MenubarTrigger>File</MenubarTrigger>
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
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MenubarMenu onOpenChange={handleOpenChange}>
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
          <MenubarSeparator />
          <MenubarGroup>
            <MyMenuItem m={menuItems.preference} />
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MenubarMenu onOpenChange={handleOpenChange}>
        <MenubarTrigger>Search</MenubarTrigger>
        <MenubarContent className="w-auto min-w-max">
          <MenubarGroup>
            <MyMenuItem m={menuItems.searchFile} />
            <MyMenuItem m={menuItems.searchNext} />
            <MyMenuItem m={menuItems.searchPrev} />
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MenubarMenu onOpenChange={handleOpenChange}>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent className="w-auto min-w-max">
          <MenubarGroup>
            <MyMenuItem m={menuItems.toggleFileViewMode} />
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup>
            <MyMenuItem m={menuItems.thumbnailSizeDown} />
            <MyMenuItem m={menuItems.thumbnailSizeUp} />
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup>
            <MenubarSub>
              {/* -------------------------------------- */}
              <MenubarSubTrigger>ソート</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarGroup>
                  <MyMenuItem m={menuItems.sortByName} />
                  <MyMenuItem m={menuItems.sortByExt} />
                  <MyMenuItem m={menuItems.sortBySize} />
                  <MyMenuItem m={menuItems.sortByTime} />
                </MenubarGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MenubarMenu onOpenChange={handleOpenChange}>
        <MenubarTrigger>Tab</MenubarTrigger>
        <MenubarContent className="w-auto min-w-max">
          <MenubarGroup>
            <MyMenuItem m={menuItems.cloneTab} />
            <MyMenuItem m={menuItems.closeCurrentTab} />
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup>
            <MyMenuItem m={menuItems.nextTab} />
            <MyMenuItem m={menuItems.prevTab} />
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup>
            <MyMenuItem m={menuItems.siblingDirPrev} />
            <MyMenuItem m={menuItems.siblingDirNext} />
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
