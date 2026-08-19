import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import { Plus, X } from 'lucide-react';

import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

import { TabInfo, useUIStore } from "@/store/ui-store"
import { Button } from "./ui/button";
import { useCallback, useEffect, useRef } from "react";
import { commands } from "@/lib/bindings";
import { homeDir } from "@tauri-apps/api/path";

export function TabBar() {
    const creatingInitialTab = useRef(false);

    const tabs = useUIStore(state => state.tabs);
    const moveTab = useUIStore(state => state.moveTab);
    const addTab = useUIStore(state => state.addTab);
    const currentTabId = useUIStore(state => state.currentTabId);
    const setCurrentTabId = useUIStore(state => state.setCurrentTabId);
    const removeTab = useUIStore(state => state.removeTab);

    const createNewTabHandler = useCallback(async () => {
        const tabId = await commands.createTab();
        const path = await homeDir();
        const absPath = await tauri_path_resolve(path);
        addTab({ id: tabId, path: absPath });
        setCurrentTabId(tabId);
    }, [addTab, setCurrentTabId]);

    useEffect(() => {
        if (tabs.length !== 0 || creatingInitialTab.current) return;
        creatingInitialTab.current = true;
        createNewTabHandler();
    }, [tabs, createNewTabHandler,]);

    const removeTabHandler = (index: number) => () => {
        console.log(`remove ${index}`)
        removeTab(index);
    }

    return (
        <div className="flex">
            <NewTabButton onClick={createNewTabHandler} />
            <DragDropProvider
                onDragEnd={(e) => {
                    if (e.canceled) return;
                    console.log('onDropEnd: source=', e.operation.source?.id, ' target=', e.operation.target?.id);

                    // initialIndex, index を読むため
                    if (!isSortable(e.operation.source)) return;
                    const { initialIndex, index } = e.operation.source;
                    console.log('    initialIndex=', initialIndex, ' index=', index);
                    moveTab(initialIndex, index);
                }}
                modifiers={(defaults) => [...defaults, RestrictToHorizontalAxis]}
            >
                <div style={{ display: 'flex' }}>
                    {tabs.map((t, i) =>
                        <TabButton key={t.id} tab={t} index={i} isSelected={t.id == currentTabId} onRemove={removeTabHandler(i)} />
                    )}
                </div>

            </DragDropProvider>

        </div>
    )
}

function NewTabButton({ onClick }: { onClick: () => void }) {
    return (
        <Button onClick={onClick}><Plus /></Button>
    )
}

function TabButton({ tab, index, isSelected, onRemove }: { tab: TabInfo, index: number, isSelected: boolean, onRemove: () => void }) {
    const { ref } = useSortable({
        id: tab.id,
        index: index
    });
    return (
        <div className="relative inline-block group">
            <Button ref={ref} className={`${isSelected ? 'border-2' : ''}`}>
                {tab.path}
            </Button>
            <div className="w5 flex justify-end">
                <div onClick={onRemove} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black rounded-md" >
                    <X />
                </div>
            </div>
        </div>
    )

}
