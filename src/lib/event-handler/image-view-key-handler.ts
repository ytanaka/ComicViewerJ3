import { useTabStore } from '@/store/tab/store';
import { dialogCommands } from '../commands/dialog-commands';
import { TabInfo } from '../bindings-wrapper';
import { zoomLevelNormalize } from '../tools/image-zoom';

function st() {
  return useTabStore.getState();
}

export function imageView_handleKeyDown(e: KeyboardEvent): boolean {
  if (dialogCommands.isOpenAnyDialog()) return false;
  const tab = st().getCurrentTab();
  if (!tab) return false;
  const tabInfo = tab.info;

  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const NO_MOD = !C && !S && !A;

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
  // 回転
  // -------------------------------------------------------------------------------------------------------------------

  // TODO

  // -------------------------------------------------------------------------------------------------------------------
  // 2ページ表示
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === ' ') {
    st().setDualImage(tabInfo.id, !tab.imageViewMode.dualImage);
    e.preventDefault();
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 画像モード終了
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && (e.key === 'Escape' || e.key === 'Enter')) {
    st().setImageView(tabInfo.id, false);
    e.preventDefault();
    return true;
  }

  return false;
}

function setZoomLevel(e: KeyboardEvent, tabInfo: TabInfo, level: number) {
  st().setZoomLevel(tabInfo.id, zoomLevelNormalize(level));
  e.preventDefault();
}
