import { _useTabStore_setExistTabFields, mkImageViewMode, TabId } from './types';
import { TabStore } from './store';
import { StateCreator } from 'zustand';
import { zoomLevelNormalize } from '@/lib/tools/image-zoom';
import { useUiVolatileStore } from '../ui-volatile-store';
import { windowCommands } from '@/lib/commands/window-commands';

export interface ImageViewModeActions {
  setImageView: (tabId: TabId, b: boolean) => void;
  setDualImage: (tabId: TabId, b: boolean, reverse: boolean) => void;
  setZoomLevel: (tabId: TabId, n: number) => void;
  setUseOriginalSize: (tabId: TabId, b: boolean) => void;
  setShowImageInfo: (tabId: TabId, b: boolean) => void;
}

export const createImageViewModeActions: StateCreator<
  TabStore,
  [['zustand/immer', never]],
  [],
  ImageViewModeActions
> = set => {
  return {
    setImageView: (tabId: TabId, b: boolean) => {
      const full = useUiVolatileStore.getState().isFullscreen;
      const shouldFull = useUiVolatileStore.getState().shouldFullscreenWhenImageView;
      if (full) {
        if (!b) {
          windowCommands.setFullscreen(false);
        }
      } else {
        if (b && shouldFull) {
          windowCommands.setFullscreen(true);
        }
      }

      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.imageViewMode = {
            ...mkImageViewMode(),
            enable: b,
            showInfo: tab.imageViewMode.showInfo,
          };
        });
      });
    },

    setDualImage: (tabId: TabId, b: boolean, reverse: boolean) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.imageViewMode = {
            ...mkImageViewMode(),
            enable: true,
            rotate: 0,
            dualImage: b,
            reverseDualImage: reverse,
            showInfo: tab.imageViewMode.showInfo,
          };
        });
      });
    },

    setZoomLevel: (tabId: TabId, n: number) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.imageViewMode.zoomLevel = zoomLevelNormalize(n);
        });
      });
    },

    setUseOriginalSize: (tabId: TabId, b: boolean) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.imageViewMode = {
            ...mkImageViewMode(),
            enable: true,
            useOriginalSize: b,
            showInfo: tab.imageViewMode.showInfo,
          };
        });
      });
    },

    setShowImageInfo: (tabId: TabId, b: boolean) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.imageViewMode.showInfo = b;
        });
      });
    },
  };
};
