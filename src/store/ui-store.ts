import { create } from 'zustand'

interface UIStore {
    currentTabId?: number,
    tabs: TabInfo[],

    setCurrentTabId: (tabId: number) => void,

    addTab: (tab: TabInfo) => void,
    moveTab: (fromIndex: number, toIndex: number) => void,
    removeTab: (index: number) => void,
}

export type TabInfo = {
    id: number,
    path: string,
}

export const useUIStore = create<UIStore>((set) => (
    {
        currentTabId: undefined,
        tabs: [],

        setCurrentTabId: (tabId: number) => {
            set(() => ({ currentTabId: tabId }))
        },

        addTab: (tab) => {
            set((prev) => ({ tabs: [...prev.tabs, tab] }))
        },

        moveTab: (fromIndex: number, toIndex: number) => {
            set((prev) => {
                if (fromIndex === toIndex) return prev;

                const newList = [...prev.tabs];
                const [removed] = newList.splice(fromIndex, 1); // 1つ削除
                newList.splice(toIndex, 0, removed); // 1つ追加
                return { tabs: newList };
            })
        },

        removeTab: (index: number) => {
            set((prev) => {
                const newList = [...prev.tabs];
                newList.slice(index, 1); // 1つ削除
                return { tabs: newList }
            })
        }

    }
))
