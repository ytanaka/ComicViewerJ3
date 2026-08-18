import { create } from 'zustand'

type UIStore = {
    tabId?: number,

    setTabId: (tabId: number) => void,
}

export const useUIStore = create<UIStore>((set) => (
    {
        tabId: undefined,
        setTabId: (tabId) => set(() => ({ tabId })),
    }
))
