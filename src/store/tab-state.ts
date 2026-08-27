import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabInfo } from './tab-info';
import { TabFilesOp } from './tab-files';
import { ExecExclusibe } from '@/lib/utils';

interface TabState {
  // tabs が空の場合は0
  currentTabIndex: number;
  tabs: TabInfo[];

  setCurrentTabIndex: (index: number) => void;
  setTabs: (tabs: TabInfo[]) => void;

  addTab: (tab: TabInfo) => void;
  removeTab: (id: number) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;

  getTab: (id: number) => TabInfo | undefined;
  updateTab: (id: number, fn: (tab: TabInfo | undefined) => void) => boolean;

  // ※ コンポーネントの中で使用すると currentTabIndex が変化しても再描画が発生しないので注意
  getCurrentTab: () => TabInfo;
}

export const useTabState = create<TabState>()(
  persist(
    (set, get) => ({
      currentTabIndex: 0,
      localStrageTabs: [],
      tabs: [],

      setCurrentTabIndex: (index: number) => {
        set(prev => {
          if (index < 0 || (index !== 0 && prev.tabs.length <= index))
            throw Error(`setCurrentTabIndex(): invalid tab index: ${index}`);
          return { currentTabIndex: index };
        });
      },
      setTabs: (tabs: TabInfo[]) => {
        set(() => {
          return { tabs: [...tabs] }
        })
      },

      // ※ カレントタブは追加されたタブに移る
      addTab: tab => {
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
      removeTab: (id: number) => {
        const tab = get().getTab(id);
        if (!tab) throw Error(`removeTab(): no tab(id:${id})`);

        set(prev => {
          const newList = prev.tabs.filter(t => t.id !== tab.id);

          // 最後のタブが削除されたら、左側のタブをカレントにする
          return { tabs: newList, currentTabIndex: Math.max(0, Math.min(prev.currentTabIndex, newList.length - 1)) };
        });
      },

      getTab(id: number): TabInfo | undefined {
        return get().tabs.find(t => t.id === id);
      },

      // タブ更新 (idのタブが存在しない場合は何もしない)
      updateTab: (id: number, fn: (tab: TabInfo) => void) => {
        const tab = get().getTab(id);
        if (!tab) return false;
        set(prev => {
          fn(tab);
          return { tabs: [...prev.tabs] };
        });
        return true;
      },

      getCurrentTab: (): TabInfo => {
        const { tabs, currentTabIndex } = get();
        if (!tabs[currentTabIndex]) throw new Error(`no tab`);
        return tabs[currentTabIndex];
      },
    }),
    {
      name: 'tab-state',
      partialize: state => {
        return {
          currentTabIndex: state.currentTabIndex,
          tabs: state.tabs.map((t) => {
            return {
              files: { path: t.files.path },
              focusHistory: t.files.focusHistory,
            }
          }),
        };
      },
      onRehydrateStorage: () => state => {
        if (!state) return;
        try {
          for (let i = 0; i < state.tabs.length; i++) {
            // とりあえず -1 にしておいてTabStateInitializer で初期化する
            state.tabs[i].id = -1;
            state.tabs[i].execExclusive = new ExecExclusibe();
            new TabFilesOp(state.tabs[i]).init_except_path();
          }
        } catch (e) {
          console.error(e);
        }
        console.info('TabState: onRehydrateStorage !!!!!', state);
      },
    }
  )
);
