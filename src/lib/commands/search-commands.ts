import { toast } from 'sonner';

import { getQueryData_getDirEntries } from '@/services/tab-dir-entry';
import { useSearchTextStore } from '@/store/file-search-text-store';
import { useTabStore } from '@/store/tab/store';
import { searchHelper } from './search-helper';

export const searchCommands = {
  searchStart() {
    showSearchHelp();
  },

  searchNext() {
    searchNextPrev(true);
  },
  searchPrev() {
    searchNextPrev(false);
  },
};

function searchNextPrev(next: boolean): boolean {
  const tab = useTabStore.getState().getCurrentTab();
  const romaji = useSearchTextStore.getState().text;
  if (!tab || romaji.length === 0) return showSearchHelp();

  const dirEntries = getQueryData_getDirEntries(tab.info.id);
  if (!dirEntries || dirEntries.length <= 1) return showSearchHelp();

  const focusIndex = tab.selection.focusIndex;

  let startIndex = next ? focusIndex + 1 : focusIndex - 1;
  if (dirEntries.length <= startIndex) startIndex = 0;
  if (startIndex < 0) startIndex = dirEntries.length - 1;
  searchHelper.searchNextFilename(tab, startIndex, romaji, !next);

  return true;
}

function showSearchHelp(): boolean {
  toast.info('ファイル名を検索するときは、IMEをOFFにしてローマ字入力してください。', {
    id: 'showSearchHelp',
    duration: 5000,
    description: 'ファイルが見つかった後、次のファイルを検索するには CTRL+N、前のファイルを検索するには CTRL+P',
  });
  return false;
}
