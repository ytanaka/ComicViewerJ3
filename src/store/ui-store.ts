import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum FileListHeaderN {
  Icon = 0,
  Name,
  Ext,
  Size,
  Date,
}

// localStrage に保存するUIの設定
export interface UiStore {
  // 設定画面でデバッグ項目を編集可能にする  
  debugPreferenceOn: boolean;

  // FileListのヘッダーサイズ
  fileListHeaderSizes: number[];

  // ファイル検索テキスト入力のタイムアウト
  fileSearchInputTimeoutMs: number;

  // ファイル検索結果を表示するタイムアウト
  fileSearchResultDisplayTimeoutMs: number;

  setDebugPreferenceOn: (b: boolean) => void;

  setFileListHeaderSizes: (sizes: number[]) => void;
  setFileSearchInputTimeoutMs: (ms: number) => void;
  setFileSearchResultDisplayTimeoutMs: (ms: number) => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    set => ({
      debugPreferenceOn: false,
      fileListHeaderSizes: [35, 500, 100, 120, 180],
      fileSearchInputTimeoutMs: 2000,
      fileSearchResultDisplayTimeoutMs: 2000,

      setDebugPreferenceOn: (b: boolean) => {
        set(() => { return { debugPreferenceOn: b }; });
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
    }
  )
);
