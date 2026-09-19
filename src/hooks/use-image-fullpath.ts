import { useQuery } from '@tanstack/react-query';
import { join as tauri_join } from '@tauri-apps/api/path';

import { useTabStore } from '@/store/tab/store';
import { TabId } from '@/store/tab/types';
import { useCmdGetDirEntries } from '@/services/tab-dir-entry';


// TODO 消す

// ImageView の中で、DirEntry[] のファイル名をフルパスに変換する
export function useImageFullpath(tabId: TabId) {
  const tab = useTabStore(state => state.getTab(tabId))!;
  const { data: dirEntries } = useCmdGetDirEntries(tab.info);

  return useQuery({
    queryKey: ['mk-image-fullpath', tab.info.id, tab.info.path, tab.refreshCount],
    enabled: !!tab && !!dirEntries,
    queryFn: async () => {
      if (!tab || !dirEntries) throw new Error('BUG');
      const paths: string[] = [];
      for (let i = 0; i < dirEntries.length; i++) {
        const p = await tauri_join(tab.info.path, dirEntries[i].name);
        paths.push(p);
      }
      return paths;
    },
  });
}
