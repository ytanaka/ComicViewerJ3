import { useEffect } from "react";

import { TabBar } from "./TabBar";
import { tabCommands } from "@/lib/commands/tab-commands";

export function TabBarWrapper() {
  // キー操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;

      if (e.key === "t") {
        tabCommands.cloneCurrentTab();
      } else if (e.key === "w") {
        tabCommands.removeCurrentTab();
      } else if (e.key === "PageUp") {
        tabCommands.setCurrentTabNextPrev(-1);
      } else if (e.key === "PageDown") {
        tabCommands.setCurrentTabNextPrev(1);
      } else {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <TabBar />
  )
}