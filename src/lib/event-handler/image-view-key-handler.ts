import { useTabStore } from '@/store/tab/store';
import { dialogCommands } from '../commands/dialog-commands';
import { imageCommands } from '../commands/image-commands';

function st() {
  return useTabStore.getState();
}

export async function imageView_handleKeyDown(e: KeyboardEvent): Promise<boolean> {
  const ret = await imageView_handleKeyDown_impl(e);
  if (ret) e.preventDefault();
  return ret;
}
async function imageView_handleKeyDown_impl(e: KeyboardEvent): Promise<boolean> {
  if (dialogCommands.isOpenAnyDialog()) return false;
  const tab = st().getCurrentTab();
  if (!tab) return false;

  const [C, S, A] = [e.ctrlKey, e.shiftKey, e.altKey];
  const NO_MOD = !C && !S && !A;
  const ALT_ONLY = !C && !S && A;

  // -------------------------------------------------------------------------------------------------------------------
  // 拡大縮小
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === '+') {
    imageCommands.incZoom(1);
    return true;
  }
  if (NO_MOD && e.key === '-') {
    imageCommands.incZoom(-1);
    return true;
  }
  if (NO_MOD && e.key === 'Enter' && tab.imageViewMode.zoomLevel !== 0) {
    imageCommands.incZoom(0);
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // フルスクリーン ON/OFF
  // -------------------------------------------------------------------------------------------------------------------
  console.debug(e);
  if ((NO_MOD && e.key === 'F11') || (ALT_ONLY && e.key === 'Enter')) {
    await imageCommands.toggleFullscreen();
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
    imageCommands.toggleDualView();
    return true;
  }
  if (NO_MOD && e.key === '\\') {
    imageCommands.toggleReverseDualView();
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 原寸表示
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && e.key === '0') {
    imageCommands.originalSize();
    return true;
  }
  if (NO_MOD && e.key === 'Enter' && tab.imageViewMode.useOriginalSize) {
    imageCommands.fitWindow();
    return true;
  }

  // -------------------------------------------------------------------------------------------------------------------
  // 画像モード終了
  // -------------------------------------------------------------------------------------------------------------------
  if (NO_MOD && (e.key === 'Escape' || e.key === 'Enter')) {
    imageCommands.exitImageView();
    return true;
  }

  return false;
}
