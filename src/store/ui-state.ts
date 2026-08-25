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
  fileListHeaderSizes: number[];

  getFileListHeaderSizes: () => number[];
  setFileListHeaderSizes: (sizes: number[]) => void;
}

export const useUiState = create<UiState>()(
  persist(
    (set, get) => ({
      fileListHeaderSizes: [40, 600, 80, 80, 160],

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
    }
  )
);
