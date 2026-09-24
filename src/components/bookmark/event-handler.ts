import { dialogCommands } from '@/lib/commands/dialog-commands';
import { tabCommands } from '@/lib/commands/tab-commands';
import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { Bookmark, useBookmarkStore } from '@/store/bookmark-store';
import { useTabStore } from '@/store/tab/store';

function bk() {
  return useBookmarkStore.getState();
}
function tb() {
  return useTabStore.getState();
}

export function bookmark_eventhandler(e: KeyboardEvent, newBookmark: Bookmark): boolean {
  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const NO_MOD = !C && !S && !A;
  const ALT_ONLY = !C && !S && A;

  const focusIndex = bk().focusIndex;

  // 選択されたブックマークでタブを開く
  if (NO_MOD && e.key === 'Enter') {
    bookmarkCommands.newTab();
    return true;
  }

  // カーソル移動
  if (NO_MOD && e.key === 'ArrowDown') {
    bk().setFocus(focusIndex + 1);
    return true;
  } else if (NO_MOD && e.key === 'ArrowUp') {
    bk().setFocus(focusIndex - 1);
    return true;
  } else if (NO_MOD && e.key === 'Home') {
    bk().setFocus(0);
    return true;
  } else if (NO_MOD && e.key === 'End') {
    bk().setFocus(bk().list.length - 1);
    return true;
  } else if (NO_MOD && (e.key === 'PageUp' || e.key === 'PageDown')) {
    // 何もしない
    return true;
  }

  // コマンド
  if (ALT_ONLY && e.key === 'a') {
    bookmarkCommands.add(newBookmark);
    return true;
  } else if (ALT_ONLY && e.key === 'd') {
    bookmarkCommands.remove();
    return true;
  } else if (ALT_ONLY && e.key === 'ArrowDown') {
    bookmarkCommands.moveFocusUpDown(1);
    return true;
  } else if (ALT_ONLY && e.key === 'ArrowUp') {
    bookmarkCommands.moveFocusUpDown(-1);
    return true;
  }

  return false;
}

export const bookmarkCommands = {
  add(newBookmark: Bookmark) {
    const tab = tb().getCurrentTab();
    if (!tab) return;
    const dirEntries = getQueryData_getDirEntries(tab.info.id);
    if (!dirEntries) return;

    useBookmarkStore.getState().addBookmark(newBookmark);
  },

  remove() {
    const focusIndex = bk().focusIndex;
    useBookmarkStore.getState().removeBookmark(focusIndex);
  },

  moveFocusUpDown(i: number) {
    const focusIndex = bk().focusIndex;
    useBookmarkStore.getState().moveBookmark(focusIndex, i);
  },

  async newTab() {
    const b = bk().list[bk().focusIndex];
    await tabCommands.cloneTab(b.dir);

    const tab = tb().getCurrentTab();
    if (!tab) return;
    tb().setViewMode(tab.info.id, b.mode);
    tb().setThumbnailSize(tab.info.id, b.thumbnailSize);
    tb().pushHistory(tab.info.id, b.dir, b.name);

    dialogCommands.closeBookmark();
  },
};
