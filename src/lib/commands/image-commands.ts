import { useTabStore } from '@/store/tab/store';
import { zoomLevelNormalize } from '../tools/image-zoom';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { windowCommands } from './window-commands';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';

function st() {
  return useTabStore.getState();
}

export const imageCommands = {
  exitImageView() {
    const tab = st().getCurrentTab();
    if (!tab) return;

    st().setImageView(tab.info.id, false);
    useScrollToFocusStore.getState().setNeedScroll(true);
  },

  // n: +1: ズームイン, -1: ズームアウト, 0: リセット
  incZoom(n: number) {
    const tab = st().getCurrentTab();
    if (!tab) return;

    let newLevel = tab.imageViewMode.zoomLevel;
    newLevel += n;
    if (n === 0) newLevel = 0;
    st().setZoomLevel(tab.info.id, zoomLevelNormalize(newLevel));
  },

  originalSize() {
    const tab = st().getCurrentTab();
    if (!tab) return;

    st().setUseOriginalSize(tab.info.id, true);
  },

  fitWindow() {
    const tab = st().getCurrentTab();
    if (!tab) return;

    st().setUseOriginalSize(tab.info.id, false);
  },

  toggleDualView() {
    const tab = st().getCurrentTab();
    if (!tab) return;

    st().setDualImage(tab.info.id, !tab.imageViewMode.dualImage, false);
  },

  toggleReverseDualView() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    if (!tab.imageViewMode.dualImage) return;

    st().setDualImage(tab.info.id, true, !tab.imageViewMode.reverseDualImage);
  },

  async toggleFullscreen() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    if (!tab.imageViewMode.enable) return;

    const full = useUiVolatileStore.getState().isFullscreen;
    useUiVolatileStore.getState().setField('shouldFullscreenWhenImageView', !full);
    await windowCommands.setFullscreen(!full);
  },

  async toggleShowInfo() {
    const tab = st().getCurrentTab();
    if (!tab) return;
    if (!tab.imageViewMode.enable) return;

    st().setShowImageInfo(tab.info.id, !tab.imageViewMode.showInfo);
  },
};
