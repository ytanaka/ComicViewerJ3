import { useTabStore } from "@/store/tab/store";
import { FileViewMode } from "@/store/tab/types";

function st() {
  return useTabStore.getState();
}

export const fileViewModeCommands = {
  toggleViewMode() {
    const tab = st().getCurrentTab()
    if (!tab) return;

    let newMode;
    if (tab.fileViewMode === FileViewMode.List) {
      newMode = FileViewMode.Thumbnail;
    } else {
      newMode = FileViewMode.List;
    }
    st().setViewMode(tab.info.id, newMode);

  }
};
