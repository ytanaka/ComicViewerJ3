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

  showPreferencesDialog: boolean;

  // FileListのヘッダーサイズ
  fileListHeaderSizes: number[];

  // ファイル検索テキスト入力のタイムアウト
  fileSearchInputTimeoutMs: number;

  // ファイル検索結果を表示するタイムアウト
  fileSearchResultDisplayTimeoutMs: number;

  setAppInitialized: () => void;
  setShowPreferencesDialog: (b: boolean) => void;

  setFileListHeaderSizes: (sizes: number[]) => void;
  setFileSearchInputTimeoutMs: (ms: number) => void;
  setFileSearchResultDisplayTimeoutMs: (ms: number) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    set => ({
      appInitialized: false,
      showPreferencesDialog: false,
      fileListHeaderSizes: [35, 500, 100, 120, 180],
      fileSearchInputTimeoutMs: 1000,
      fileSearchResultDisplayTimeoutMs: 2000,

      setAppInitialized: () => {
        set(() => { return { appInitialized: true }; });
      },

      setShowPreferencesDialog: (b: boolean) => {
        set(() => { return { showPreferencesDialog: b }; });
      },

      setFileListHeaderSizes: (sizes: number[]) => {
        set(() => { return { fileListHeaderSizes: sizes }; });
      },

      setFileSearchInputTimeoutMs: (ms: number) => {
        set(() => ({ fileSearchInputTimeoutMs: ms }));
      },

      setFileSearchResultDisplayTimeoutMs: (ms: number) => {
        set(() => ({ fileSearchResultDisplayTimeoutMs: ms }));
      }
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
