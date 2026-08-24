import { create } from "zustand";
import { persist } from "zustand/middleware";

export enum FileListHeaderN {
  Name = 0,
  Ext,
  Size,
  Date
}

export interface UiState {
  fileListHeaderSizes: number[],

  getFileListHeaderSizes: () => number[];
  setFileListHeaderSizes: (sizes: number[]) => void;
}

export const useUiState = create<UiState>()(
  persist(
    (set, get) => ({
      fileListHeaderSizes: [70, 10, 10, 20],

      getFileListHeaderSizes: () => {
        return get().fileListHeaderSizes;
      },

      setFileListHeaderSizes: (sizes: number[]) => {
        set(() => {
          return { fileListHeaderSizes: sizes };
        })
      },
    }),
    {
      name: 'ui-state',
    }
  )
);