import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum FileListHeaderN {
  Icon = 0,
  Name,
  Ext,
  Size,
  Date,
}
export const MAX_TAB_NUM_LIMIT = 30;

// localStrage に保存するUIの設定
export interface UiState {
  // 設定画面でデバッグ項目を編集可能にする
  debugPreferenceOn: boolean;
  // 最大タブ数
  maxTabNum: number;
  // FileListのヘッダーサイズ
  fileListHeaderSizes: number[];
  // ファイル検索テキスト入力のタイムアウト
  fileSearchInputTimeoutMs: number;
  // ファイル検索結果を表示するタイムアウト
  fileSearchResultDisplayTimeoutMs: number;
}

type UiState_and_Action = UiState
  & {
    setField: <K extends keyof UiState>(key: K, value: UiState[K]) => void;
  };

export const useUiStore = create<UiState_and_Action>()(
  persist(
    set => ({
      debugPreferenceOn: false,
      maxTabNum: 10,
      fileListHeaderSizes: [35, 500, 100, 120, 180],
      fileSearchInputTimeoutMs: 2000,
      fileSearchResultDisplayTimeoutMs: 2000,

      setField: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'ui-state',
    }
  )
);
