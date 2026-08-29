import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum FileListHeaderN {
  Icon = 0,
  Name,
  Ext,
  Size,
  Date,
}

export interface UiStore {
  // アプリケーションが初期化済みフラグ
  appInitialized: boolean;

  // FileListのヘッダーサイズ
  fileListHeaderSizes: number[];

  setAppInitialized: () => void;

  setFileListHeaderSizes: (sizes: number[]) => void;
}

export const useUiStore = create<UiStore>()(persist((set) => (
  {
    appInitialized: false,
    fileListHeaderSizes: [35, 500, 100, 120, 180],

    setAppInitialized: () => {
      set(() => {
        return { appInitialized: true };
      });
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
  })
);
