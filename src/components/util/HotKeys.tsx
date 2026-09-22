import { dialogCommands } from '@/lib/commands/dialog-commands';
import { searchHelper } from '@/lib/commands/search-helper';
import { getAllMenuItems } from '@/lib/menu-items';
import { useEffect } from 'react';

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
          m.exec();
          searchHelper.cancel();
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return <></>;
}
