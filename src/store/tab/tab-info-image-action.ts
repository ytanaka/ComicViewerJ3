import { _useTabStore_setExistTabFields, TabId } from './types';
import { TabStore } from './store';
import { StateCreator } from 'zustand';
import { zoomLevelNormalize } from '@/lib/tools/image-zoom';
import { useUiVolatileStore } from '../ui-volatile-store';
import { windowCommands } from '@/lib/commands/window-commands';

export interface ImageViewModeActions {
  setImageView: (tabId: TabId, b: boolean) => void;
  setDualImage: (tabId: TabId, b: boolean) => void;
  setZoomLevel: (tabId: TabId, n: number) => void;
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
          tab.imageViewMode.enable = b;
        });
      });
    },

    setDualImage: (tabId: TabId, b: boolean) => {
      set(state => {
        _useTabStore_setExistTabFields(state, tabId, tab => {
          tab.imageViewMode.dualImage = b;
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
  };
};
