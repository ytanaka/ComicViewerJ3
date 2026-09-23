import { ReactNode } from 'react';

import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Menubar,
  MenubarContent,
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
import { useTabStore } from '@/store/tab/store';

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
function MyMenubarMenu({ name, children }: { name: string; children: ReactNode }) {
  const setFocus = useFocusStore(state => state.setFocus);
  function handleOpenChange(open: boolean) {
    if (!open) setFocus();
  }
  return (
    <MenubarMenu onOpenChange={handleOpenChange}>
      <MenubarTrigger>{name}</MenubarTrigger>
      <MenubarContent className="w-auto min-w-max">{children}</MenubarContent>
    </MenubarMenu>
  );
}

export function Menu() {
  const imageView = useTabStore(state => state.getCurrentTab()?.imageViewMode.enable === true);
  const full = useUiVolatileStore(state => state.isFullscreen);
  return (
    <Menubar hidden={full} style={{ display: full ? 'none' : undefined }}>
      {imageView ? <MenuImageView /> : <MenuFileView />}
    </Menubar>
  );
}

function MenuFileView() {
  return (
    <>
      <MyMenubarMenu name="ファイル">
        <MyMenuItem m={menuItems.openDir} />
        <MyMenuItem m={menuItems.createEmptyFile} />
        <MyMenuItem m={menuItems.createDir} />
        <MyMenuItem m={menuItems.openFileProperty} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.exitApp} />
      </MyMenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MyMenubarMenu name="編集">
        <MyMenuItem m={menuItems.cutFile} />
        <MyMenuItem m={menuItems.copyFile} />
        <MyMenuItem m={menuItems.pasteFile} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.deleteFile} />
        <MyMenuItem m={menuItems.renameFile} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.preference} />
        <MyMenuItem m={menuItems.bookmark} />
      </MyMenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MyMenubarMenu name="検索">
        <MyMenuItem m={menuItems.searchFile} />
        <MyMenuItem m={menuItems.searchNext} />
        <MyMenuItem m={menuItems.searchPrev} />
      </MyMenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MyMenubarMenu name="表示">
        <MyMenuItem m={menuItems.toggleFileViewMode} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.thumbnailSizeDown} />
        <MyMenuItem m={menuItems.thumbnailSizeUp} />
        <MenubarSeparator />
        <MenubarSub>
          {/* -------------------------------------- */}
          <MenubarSubTrigger>ソート</MenubarSubTrigger>
          <MenubarSubContent>
            <MyMenuItem m={menuItems.sortByName} />
            <MyMenuItem m={menuItems.sortByExt} />
            <MyMenuItem m={menuItems.sortBySize} />
            <MyMenuItem m={menuItems.sortByTime} />
          </MenubarSubContent>
        </MenubarSub>
      </MyMenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MyMenubarMenu name="タブ">
        <MyMenuItem m={menuItems.cloneTab} />
        <MyMenuItem m={menuItems.closeCurrentTab} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.nextTab} />
        <MyMenuItem m={menuItems.prevTab} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.siblingDirPrev} />
        <MyMenuItem m={menuItems.siblingDirNext} />
      </MyMenubarMenu>
    </>
  );
}
function MenuImageView() {
  return (
    <>
      <MyMenubarMenu name="タブ">
        <MyMenuItem m={menuItems.cloneTab} />
        <MyMenuItem m={menuItems.closeCurrentTab} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.nextTab} />
        <MyMenuItem m={menuItems.prevTab} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.siblingDirPrev} />
        <MyMenuItem m={menuItems.siblingDirNext} />
      </MyMenubarMenu>
      {/* -------------------------------------------------------------------------------------------------------- */}
      <MyMenubarMenu name="画像">
        <MyMenuItem m={menuItems.endImageViewMode} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.imageZoomIn} />
        <MyMenuItem m={menuItems.imageZoomOut} />
        <MyMenuItem m={menuItems.imageFit} />
        <MyMenuItem m={menuItems.imageZoomOriginal} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.imageDualView} />
        <MyMenuItem m={menuItems.imageReverseDualView} />
        <MenubarSeparator />
        <MyMenuItem m={menuItems.changeFullscreen} />
      </MyMenubarMenu>
    </>
  );
}
