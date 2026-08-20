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
            set((prev) => {
                if (prev.tabs.findIndex((t) => t.id == tabId) < 0) throw Error(`no tabId: ${tabId}`);
                return ({ currentTabId: tabId })
            })
        },

        // ※) 空の状態からタブが追加されたら、currentTabId が更新される
        addTab: (tab) => {
            set((prev) => {
                if (0 <= prev.tabs.findIndex((t) => t.id === tab.id)) throw Error(`dup tab.id: ${tab.id}`);

                if (prev.tabs.length === 0) {
                    return { tabs: [...prev.tabs, tab], currentTabId: tab.id };
                } else {
                    return { tabs: [...prev.tabs, tab] };
                }
            })
        },

        moveTab: (fromIndex: number, toIndex: number) => {
            set((prev) => {
                if (prev.tabs.length === 0) throw Error(`empty tabs`);
                if (fromIndex < 0 || prev.tabs.length <= fromIndex ||
                    toIndex < 0 || prev.tabs.length <= toIndex) throw Error(`invalid index: ${fromIndex},${toIndex} tabs.length = ${prev.tabs.length}`);
                if (fromIndex === toIndex) return prev;

                const newList = [...prev.tabs];
                const [removed] = newList.splice(fromIndex, 1); // 1つ削除
                newList.splice(toIndex, 0, removed); // 1つ追加
                return { tabs: newList };
            })
        },

        // ※) カレントタブが削除されたら currentTabId は右のタブに移動する。右のタブがない場合は左。タブがなくなったら、undefined
        removeTab: (index: number) => {
            set((prev) => {
                if (index < 0 || prev.tabs.length <= index) throw Error(`invalid index: ${index} tabs.length = ${prev.tabs.length}`);

                let newCurrent: number | null = null;
                if (prev.tabs.length === 1) {
                    newCurrent = -1; // tabs が空になる場合
                } else if (prev.tabs[index].id === prev.currentTabId) {
                    if (index === prev.tabs.length - 1) {
                        newCurrent = prev.tabs[index - 1].id; // 右端タブを削除する場合
                    } else {
                        newCurrent = prev.tabs[index + 1].id; // それ以外
                    }
                }

                const newList = [...prev.tabs];
                newList.splice(index, 1); // 1つ削除

                if (newCurrent !== null) {
                    return { tabs: newList, currentTabId: (newCurrent < 0 ? undefined : newCurrent) }
                } else {
                    return { tabs: newList }
                }
            })
        }

    }
))
