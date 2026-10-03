import React from "react";

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from '@/components/ui/context-menu';

import { TabInfo } from "@/lib/bindings-wrapper";
import { useTabStore } from "@/store/tab/store";
import { AppHotkey, AppMenuItem, menuItems } from "@/lib/menu-items";
import { HotKeyKbdGroup } from "../util/HotKeys";

function MyHotkey({ k }: { k: AppHotkey }) {
  return (
    <ContextMenuShortcut>
      <HotKeyKbdGroup k={k} />
    </ContextMenuShortcut>
  );
}

function MyMenuItem({ m }: { m: AppMenuItem }) {
  const enabled = m.checkEnabledFn == undefined || m.checkEnabledFn();
  return (
    <ContextMenuItem disabled={!enabled} onClick={m.exec}>
      {m.value}
      {m.hotkey && <MyHotkey k={m.hotkey} />}
    </ContextMenuItem>
  );
}

export function ItemContextMenu({ tab, fileIndex, render }: { tab: TabInfo, fileIndex: number, render: React.JSX.Element }) {
  const moveFocusNormal = useTabStore(state => state.moveFocusNormal);
  return (
    <ContextMenu onOpenChange={() => moveFocusNormal(tab.id, fileIndex)}>
      <ContextMenuTrigger render={render} />
      <ContextMenuContent>
        <MyMenuItem m={menuItems.renameFile} />
        <MyMenuItem m={menuItems.deleteFile} />
        <ContextMenuSeparator />
        <MyMenuItem m={menuItems.cutFile} />
        <MyMenuItem m={menuItems.copyFile} />
        <ContextMenuSeparator />
        <MyMenuItem m={menuItems.openFileProperty} />
      </ContextMenuContent>
    </ContextMenu>
  );
}