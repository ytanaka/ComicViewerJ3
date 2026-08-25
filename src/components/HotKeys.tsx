import { getAllMenuItems } from '@/lib/menu-items';
import { useEffect } from 'react';

export function HotKeys() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const menus = getAllMenuItems();

      for (let i = 0; i < menus.length; i++) {
        const m = menus[i];
        if (m.hotkey === undefined) continue;
        if (m.hotkey.alt && !e.altKey) continue;
        if (m.hotkey.ctrl && !e.ctrlKey) continue;
        if (m.hotkey.shift && !e.shiftKey) continue;
        if (m.hotkey.key !== e.key.toLowerCase()) continue;
        e.preventDefault();
        e.stopImmediatePropagation();
        m.exec();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return <></>;
}
