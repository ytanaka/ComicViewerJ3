import { THUMBNAIL_SIZE_LIST } from '@/components/tab/thumbnail-view/Thumbnails';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';
import { useTabStore } from '@/store/tab/store';
import { FileViewMode } from '@/store/tab/types';

function st() {
  return useTabStore.getState();
}

export const fileViewModeCommands = {
  toggleViewMode() {
    const tab = st().getCurrentTab();
    if (!tab) return;

    let newMode;
    if (tab.fileViewMode === FileViewMode.List) {
      newMode = FileViewMode.Thumbnail;
    } else {
      newMode = FileViewMode.List;
    }
    changeViewMode(newMode);
  },

  changeToListViewMode() {
    changeViewMode(FileViewMode.List);
  },
  changeToThumbnailViewMode() {
    changeViewMode(FileViewMode.Thumbnail);
  },

  thumbnailSizeUp() {
    thumbnailSizeUpDown(1);
  },
  thumbnailSizeDown() {
    thumbnailSizeUpDown(-1);
  },
};

function changeViewMode(mode: FileViewMode) {
  const tab = st().getCurrentTab();
  if (!tab) return;

  st().setViewMode(tab.info.id, mode);
  useScrollToFocusStore.getState().setScroll(true);
}

function thumbnailSizeUpDown(n: number) {
  const tab = st().getCurrentTab();
  if (!tab) return;

  let idx = THUMBNAIL_SIZE_LIST.findIndex(size => size === tab.thumbnailSize);
  if (idx < 0) idx = 0;

  idx += n;
  idx = Math.max(0, Math.min(idx, THUMBNAIL_SIZE_LIST.length - 1));
  const newSize = THUMBNAIL_SIZE_LIST[idx];

  if (tab.thumbnailSize === newSize) return;

  st().setThumbnailSize(tab.info.id, newSize);
  useScrollToFocusStore.getState().setScroll(true);
}
