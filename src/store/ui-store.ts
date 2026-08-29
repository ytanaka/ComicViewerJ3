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

  // ファイル検索テキスト入力のタイムアウト
  fileSearchInputTimeoutMs: number;

  setAppInitialized: () => void;
  setFileListHeaderSizes: (sizes: number[]) => void;
  setFileSearchInputTimeoutMs: (ms: number) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    set => ({
      appInitialized: false,
      fileListHeaderSizes: [35, 500, 100, 120, 180],
      fileSearchInputTimeoutMs: 1000,

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

      setFileSearchInputTimeoutMs: (ms: number) => {
        set(() => ({ fileSearchInputTimeoutMs: ms }));
      },
    }),
    {
      name: 'ui-state',
      partialize: state => {
        return {
          fileListHeaderSizes: state.fileListHeaderSizes,
          fileSearchInputTimeoutMs: state.fileSearchInputTimeoutMs,
        };
      },
    }
  )
);
