import { dialogCommands } from '@/lib/commands/dialog-commands';
import { searchHelper } from '@/lib/commands/search-helper';
import { AppHotkey, getAllMenuItems } from '@/lib/menu-items';
import { useEffect } from 'react';
import { Kbd, KbdGroup } from '../ui/kbd';

export function HotKeys() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (dialogCommands.isOpenAnyDialog()) return;

      const menus = getAllMenuItems();

      for (let i = 0; i < menus.length; i++) {
        const m = menus[i];
        if (m.hotkey === undefined) continue;
        if (m.hotkey.ignoreEvent) continue;
        if (!m.hotkey.check(e)) continue;
        if (m.checkEnabledFn && !m.checkEnabledFn()) continue;
        if (m.exec) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          searchHelper.cancel();
          m.exec();
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return <></>;
}

export function HotKeyKbdGroup({ k }: { k: AppHotkey }) {
  return (
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

  )
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
