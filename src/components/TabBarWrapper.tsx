import { useCallback, useEffect } from "react";

import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';
import { homeDir } from "@tauri-apps/api/path";

import { useTabState } from "@/store/tab-state";
import { commands } from "@/lib/bindings";
import { ListFiles } from "@/lib/list-files";
import { TabBar } from "./TabBar";

export function TabBarWrapper() {
    const tabs = useTabState(state => state.tabs);
    const currentTabIndex = useTabState(state => state.currentTabIndex);
    const addTab = useTabState(state => state.addTab);
    const removeTab = useTabState(state => state.removeTab);
    const setCurrentTabIndex = useTabState(state => state.setCurrentTabIndex);

    const createNewTabHandler = useCallback(async () => {
        if (10 <= tabs.length) return;
        const tabId = await commands.createTab();
        const path = await homeDir();
        const absPath = await tauri_path_resolve(path);
        addTab({ id: tabId, path: absPath, list: new ListFiles() });
    }, [addTab, tabs.length]);

    const removeTabHandler = useCallback(async (index: number) => {
        console.log(`remove ${index}`);
        await commands.removeTab(tabs[index].id);
        removeTab(index);
    }, [removeTab, tabs]);

    // キー操作
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!e.ctrlKey) return;

            if (e.key === "t") {
                createNewTabHandler();
            } else if (e.key === "w") {
                removeTabHandler(currentTabIndex);
            } else if (e.key === "PageUp") {
                let i = currentTabIndex - 1;
                if (i < 0) i = tabs.length - 1;
                setCurrentTabIndex(i);
            } else if (e.key === "PageDown") {
                let i = currentTabIndex + 1;
                if (tabs.length <= i) i = 0;
                setCurrentTabIndex(i);
            } else {
                return;
            }
            e.preventDefault();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [createNewTabHandler, removeTabHandler, setCurrentTabIndex, currentTabIndex, tabs.length,]);

    return (
        <TabBar onNewTab={createNewTabHandler} onRemoveTab={removeTabHandler} />
    )
}