import { useTabStore } from '@/store/tab/store';
import { dialogCommands } from '../commands/dialog-commands';
import { TabInfo } from '../bindings-wrapper';
import { zoomLevelNormalize } from '../tools/image-zoom';
import { useScrollToFocusStore } from '@/store/scroll-to-focus-store';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { windowCommands } from '../commands/window-commands';

function st() {
  return useTabStore.getState();
}

export function imageView_handleKeyDown(e: KeyboardEvent): boolean {
  const ret = imageView_handleKeyDown_impl(e);
  if (ret) e.preventDefault();
  return ret;
}
function imageView_handleKeyDown_impl(e: KeyboardEvent): boolean {
  if (dialogCommands.isOpenAnyDialog()) return false;
  const tab = st().getCurrentTab();
  if (!tab) return false;
  const tabInfo = tab.info;

  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const NO_MOD = !C && !S && !A;
  const ALT_ONLY = !C && !S && A;

  // -------------------------------------------------------------------------------------------------------------------
  // 拡大縮小
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === '+') {
    setZoomLevel(e, tabInfo, tab.imageViewMode.zoomLevel + 1);
    return true;
  }
  if (NO_MOD && e.key === '-') {
    setZoomLevel(e, tabInfo, tab.imageViewMode.zoomLevel - 1);
    return true;
  }
  if (NO_MOD && e.key === 'Enter' && tab.imageViewMode.zoomLevel !== 0) {
    setZoomLevel(e, tabInfo, 0);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // フルスクリーン ON/OFF
  // -------------------------------------------------------------------------------------------------------------------
  console.debug(e);
  if ((NO_MOD && e.key === 'F11') || (ALT_ONLY && e.key === 'Enter')) {
    const full = useUiVolatileStore.getState().isFullscreen;
    windowCommands.setFullscreen(!full);
    useUiVolatileStore.getState().setField('shouldFullscreenWhenImageView', !full);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 回転
  // -------------------------------------------------------------------------------------------------------------------

  // TODO

  // -------------------------------------------------------------------------------------------------------------------
  // 2ページ表示
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === ' ') {
    st().setDualImage(tabInfo.id, !tab.imageViewMode.dualImage, false);
    return true;
  }
  if (NO_MOD && e.key === '\\') {
    st().setDualImage(tabInfo.id, tab.imageViewMode.dualImage, !tab.imageViewMode.reverseDualImage);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 原寸表示
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === '0') {
    const newMode = !tab.imageViewMode.useOriginalSize;
    st().setUseOriginalSize(tabInfo.id, newMode);
    st().setDualImage(tabInfo.id, false, false);
    setZoomLevel(e, tabInfo, 0);
    return true;
  }
  if (NO_MOD && e.key === 'Enter' && tab.imageViewMode.useOriginalSize) {
    st().setUseOriginalSize(tabInfo.id, false);
    setZoomLevel(e, tabInfo, 0);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 画像モード終了
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && (e.key === 'Escape' || e.key === 'Enter')) {
    st().setImageView(tabInfo.id, false);
    useScrollToFocusStore.getState().setNeedScroll(true);
    return true;
  }

  return false;
}

function setZoomLevel(e: KeyboardEvent, tabInfo: TabInfo, level: number) {
  st().setZoomLevel(tabInfo.id, zoomLevelNormalize(level));
  e.preventDefault();
}
