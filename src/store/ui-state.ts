import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum FileListHeaderN {
  Icon = 0,
  Name,
  Ext,
  Size,
  Date,
}

export interface UiState {
  appInitialized: boolean;
  fileListHeaderSizes: number[];

  setAppInitialized: () => void;

  getFileListHeaderSizes: () => number[];
  setFileListHeaderSizes: (sizes: number[]) => void;
}

export const useUiState = create<UiState>()(
  persist(
    (set, get) => ({
      appInitialized: false,
      fileListHeaderSizes: [35, 500, 100, 120, 180],

      setAppInitialized: () => {
        set(() => {
          return { appInitialized: true };
        });
      },

      getFileListHeaderSizes: () => {
        return get().fileListHeaderSizes;
      },
      setFileListHeaderSizes: (sizes: number[]) => {
        set(() => {
          return { fileListHeaderSizes: sizes };
        });
      },
    }),
    {
      name: 'ui-state',
      partialize: state => {
        return {
          fileListHeaderSizes: state.fileListHeaderSizes,
        };
      },
    }
  )
);
