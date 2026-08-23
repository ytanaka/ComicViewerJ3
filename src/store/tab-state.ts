import { ListFiles } from '@/lib/list-files';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TabState {
  // tabs が空の場合は0
  currentTabIndex: number;
  tabs: TabInfo[];

  setCurrentTabIndex: (index: number) => void;

  addTab: (tab: TabInfo) => void;
  removeTab: (index: number) => number;
  moveTab: (fromIndex: number, toIndex: number) => void;

  updateTab: (index: number, tab: TabInfo) => void;
}

export type TabInfo = {
  id: number;
  path: string;
  list: ListFiles;
};

export const useTabState = create<TabState>()(
  persist(
    (set, get) => ({
      currentTabIndex: 0,
      tabs: [],

      setCurrentTabIndex: (index: number) => {
        set(prev => {
          if (index < 0 || (index !== 0 && prev.tabs.length <= index))
            throw Error(`setCurrentTabIndex(): invalid tab index: ${index}`);
          return { currentTabIndex: index };
        });
      },

      // ※ カレントタブは追加されたタブに移る
      addTab: (tab) => {
        set(prev => {
          if (0 <= prev.tabs.findIndex(t => t.id === tab.id)) throw Error(`addTab(): dup tab.id: ${tab.id}`);
          return { tabs: [...prev.tabs, tab], currentTabIndex: prev.tabs.length };
        });
      },

      moveTab: (fromIndex: number, toIndex: number) => {
        set(prev => {
          if (prev.tabs.length === 0) throw Error(`moveTab(): empty tabs`);
          if (fromIndex < 0 || prev.tabs.length <= fromIndex || toIndex < 0 || prev.tabs.length <= toIndex)
            throw Error(`moveTab(): invalid index: ${fromIndex},${toIndex} tabs.length = ${prev.tabs.length}`);
          if (fromIndex === toIndex) return prev;

          // 新しいカレントタブIndex
          let tIndex = prev.currentTabIndex;
          if (fromIndex === tIndex) {
            tIndex = toIndex;
          } else {
            if (fromIndex < tIndex) {
              tIndex -= 1;
            }
            if (toIndex <= tIndex) {
              tIndex += 1;
            }
          }

          const newList = [...prev.tabs];
          const [removed] = newList.splice(fromIndex, 1); // 1つ削除
          newList.splice(toIndex, 0, removed); // 1つ追加
          return { tabs: newList, currentTabIndex: tIndex };
        });
      },

      // ※ カレントタブが削除されたら、カレントは右のタブに移る
      removeTab: (index: number) => {
        const { tabs } = get();
        if (index < 0 || tabs.length <= index)
          throw Error(`removeTab(): invalid index: ${index} tabs.length = ${tabs.length}`);
        const removeId = tabs[index].id;

        set(prev => {
          const newList = [...prev.tabs];
          newList.splice(index, 1); // 1つ削除

          // 最後のタブが削除されたら、左側のタブをカレントにする
          return { tabs: newList, currentTabIndex: Math.max(0, Math.min(prev.currentTabIndex, prev.tabs.length - 2)) };
        });
        
        return removeId;
      },

      updateTab: (index: number, tab: TabInfo) => {
        set(prev => {
          const tabs = [...prev.tabs];
          tabs[index] = tab;
          return { tabs };
        });
      },
    }),
    {
      name: 'tab-state',
      partialize: state => {
        return {
          currentTabIndex: state.currentTabIndex,
          tabs: state.tabs.map(t => ({
            path: t.path,
          })),
        };
      },
      onRehydrateStorage: () => state => {
        console.log('TabState: onRehydrateStorage !!!', state);
        if (!state) return;
        for (let i = 0; i < state.tabs.length; i++) {
          state.tabs[i].list = new ListFiles();
        }
      },
    }
  )
);
