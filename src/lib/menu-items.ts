import { useTabStore } from '@/store/tab/store';
import { dialogCommands } from './commands/dialog-commands';
import { sortCommands } from './commands/sort-commands';
import { tabCommands } from './commands/tab-commands';
import { fileViewModeCommands } from './commands/view-mode-commands';
import { windowCommands } from './commands/window-commands';
import { FileViewMode } from '@/store/tab/types';
import { fileCommands } from './commands/file-commands';
import { searchCommands } from './commands/search-commands';
import { imageCommands } from './commands/image-commands';
import { zoomLevelNormalize } from './tools/image-zoom';

type MenuExec = () => Promise<void> | void;

export interface AppMenuItem {
  value: string;
  exec?: MenuExec;
  hotkey?: AppHotkey;
  checkEnabledFn?: () => boolean;
}

function M(value: string, exec?: MenuExec, hotkey?: string, checkEnabledFn?: () => boolean): AppMenuItem {
  return {
    value,
    exec,
    hotkey: hotkey !== undefined ? new AppHotkey(hotkey) : undefined,
    checkEnabledFn,
  };
}

export class AppHotkey {
  ctrl: boolean = false;
  alt: boolean = false;
  shift: boolean = false;
  key: string;
  ignoreEvent: boolean = false;

  constructor(s: string) {
    if (s.startsWith('###')) {
      this.ignoreEvent = true;
      s = s.slice(3);
    };

    const spl = s.split('//').map(s => s.trim()); // '+' を区切りにすると Ctrl++ で困るので '//' にする
    const [key] = spl.splice(spl.length - 1, 1);
    this.key = key.toLowerCase();
    spl.forEach(mod => {
      switch (mod.toLowerCase()) {
        case 'shift':
          this.shift = true;
          break;
        case 'ctrl':
          this.ctrl = true;
          break;
        case 'alt':
          this.alt = true;
          break;
        default:
          throw new Error(`invalid hotkey: ${s}`);
      }
    });
  }

  check(e: KeyboardEvent): boolean {
    if (this.ctrl !== e.ctrlKey) return false;
    if (this.shift !== e.shiftKey) return false;
    if (this.alt !== e.altKey) return false;
    if (this.key !== e.key.toLowerCase()) return false;
    return true;
  }
}

function st() {
  return useTabStore.getState();
}
function hasTab() {
  return !!st().getCurrentTab();
}
function isThumbnailView() {
  return st().getCurrentTab()?.fileViewMode == FileViewMode.Thumbnail;
}
function isListView() {
  return st().getCurrentTab()?.fileViewMode == FileViewMode.List;
}
function isSelected1File() {
  const sel = st().getCurrentTab()?.selection;
  if (!sel) return false;
  return sel.selectionIndexes.size === 1 && sel.selectionIndexes.has(sel.focusIndex);
}
function isSelectedAnyFile() {
  const sel = st().getCurrentTab()?.selection;
  if (!sel) return false;
  return 0 < sel.selectionIndexes.size;
}
function isImageView() {
  return st().getCurrentTab()?.imageViewMode.enable ?? false;
}
function isImageDual() {
  return st().getCurrentTab()?.imageViewMode.dualImage ?? false;
}
function notImageZoomMax() {
  const lv = st().getCurrentTab()?.imageViewMode.zoomLevel ?? 0;
  return zoomLevelNormalize(lv + 1) !== lv;
}
function notImageZoomMin() {
  const lv = st().getCurrentTab()?.imageViewMode.zoomLevel ?? 0;
  return zoomLevelNormalize(lv - 1) !== lv;
}
function notImageFitScreen() {
  const tab = st().getCurrentTab();
  if (!tab) return false;
  return tab.imageViewMode.useOriginalSize || tab.imageViewMode.zoomLevel !== 0;
}
function notImageOriginalSize() {
  const tab = st().getCurrentTab();
  if (!tab) return false;
  return !tab.imageViewMode.useOriginalSize || tab.imageViewMode.zoomLevel !== 0;
}

// =====================================================================================================================

export const menuItems = {
  // -------------------- File --------------------
  openDir: M('ディレクトリを開く', () => windowCommands.openDirectory(), 'Ctrl//O'),
  createEmptyFile: M('ファイル作成', () => console.log('CREATE FILE!!!'), 'Ctrl//F', hasTab),
  createDir: M('ディレクトリ作成', () => console.log('CREATE DIR!!!'), 'Ctrl//K', hasTab),
  openFileProperty: M(
    'プロパティ',
    () => console.log('FILE PROPERTY!!!'),
    'Alt//Enter',
    () => isSelected1File() && !isImageView()
  ),

  exitApp: M('終了', () => windowCommands.exitApp(), 'Ctrl//Q'),

  // -------------------- Edit --------------------
  copyFile: M('コピー', () => console.log('COPY!!!'), 'Ctrl//C', isSelectedAnyFile),
  cutFile: M('切り取り', () => console.log('CUT!!!'), 'Ctrl//X', isSelectedAnyFile),
  pasteFile: M('貼り付け', () => console.log('PASTE!!!'), 'Ctrl//V', hasTab),

  deleteFile: M('削除', () => console.log('DEL!!!'), 'Delete', isSelected1File),
  renameFile: M('名前変更', () => console.log('RENAME!!!'), 'F2', isSelected1File),

  preference: M('設定', () => dialogCommands.openPreference(), 'Ctrl//,'),

  // -------------------- Search --------------------
  searchFile: M('ファイル検索', () => searchCommands.searchStart(), undefined, hasTab),
  searchNext: M('次のファイルを検索', undefined, 'Ctrl//N', hasTab),
  searchPrev: M('前のファイルを検索', undefined, 'Ctrl//P', hasTab),

  // -------------------- View --------------------

  toggleFileViewMode: M(
    'リストモード、サムネイルモード切替',
    () => fileViewModeCommands.toggleViewMode(),
    'Ctrl//L',
    hasTab
  ),
  changeToListViewMode: M(
    'リストモードに切替',
    () => fileViewModeCommands.changeToListViewMode(),
    'Ctrl//L',
    isThumbnailView
  ),
  changeToThumbnailViewMode: M(
    'サムネイルモードに切替',
    () => fileViewModeCommands.changeToThumbnailViewMode(),
    'Ctrl//L',
    isListView
  ),

  thumbnailSizeUp: M(
    'サムネイルサイズを大きくする',
    () => fileViewModeCommands.thumbnailSizeUp(),
    'Ctrl//+',
    isThumbnailView
  ),
  thumbnailSizeDown: M(
    'サムネイルサイズを小さくする',
    () => fileViewModeCommands.thumbnailSizeDown(),
    'Ctrl//-',
    isThumbnailView
  ),

  sortByName: M('名前でソート', () => sortCommands.sortFiles('Name'), 'Alt//1', hasTab),
  sortByExt: M('種類でソート', () => sortCommands.sortFiles('Ext'), 'Alt//2', hasTab),
  sortBySize: M('サイズでソート', () => sortCommands.sortFiles('Size'), 'Alt//3', hasTab),
  sortByTime: M('更新日時でソート', () => sortCommands.sortFiles('Time'), 'Alt//4', hasTab),

  toggleTheme: M('テーマ切り替え', () => console.log('THEME CHANGE!!!')),

  // -------------------- Tab --------------------
  cloneTab: M('新規タブを開く', () => tabCommands.cloneCurrentTab(), 'Ctrl//T', hasTab),
  closeCurrentTab: M('現在のタブを閉じる', () => tabCommands.removeCurrentTab(), 'Ctrl//W', hasTab),

  nextTab: M('次のタブ', () => tabCommands.setCurrentTabNextPrev(1), 'Ctrl//PageDown', hasTab),
  prevTab: M('前のタブ', () => tabCommands.setCurrentTabNextPrev(-1), 'Ctrl//PageUp', hasTab),
  nextTab2: M('次のタブ2', () => tabCommands.setCurrentTabNextPrev(1), 'Ctrl//Tab', hasTab),
  prevTab2: M('前のタブ2', () => tabCommands.setCurrentTabNextPrev(-1), 'Ctrl//Shift//Tab', hasTab),

  siblingDirPrev: M('前のディレクトリ', () => fileCommands.moveToPrevNextDirectory(-1), 'Alt//ArrowLeft', hasTab),
  siblingDirNext: M('次のディレクトリ', () => fileCommands.moveToPrevNextDirectory(1), 'Alt//ArrowRight', hasTab),

  // -------------------- Image View --------------------

  endImageViewMode: M('画像表示モードをやめる', imageCommands.exitImageView, '### Escape'),
  imageZoomIn: M('画像拡大', () => imageCommands.incZoom(1), '### +', notImageZoomMax),
  imageZoomOut: M('画像縮小', () => imageCommands.incZoom(-1), '### -', notImageZoomMin),
  imageFit: M('画像を画面にフィットさせて表示', imageCommands.fitWindow, '### Enter', notImageFitScreen),
  imageZoomOriginal: M('画像をオリジナルサイズで表示', imageCommands.originalSize, '### 0', notImageOriginalSize),
  imageDualView: M('2枚表示切替', imageCommands.toggleDualView, '### Space'),
  imageReverseDualView: M('2枚表示左右反転', imageCommands.toggleReverseDualView, '### \\', isImageDual),
  changeFullscreen: M('フルスクリーン', imageCommands.toggleFullscreen, '### F11'),
};

export function getAllMenuItems() {
  return Object.values(menuItems);
}
