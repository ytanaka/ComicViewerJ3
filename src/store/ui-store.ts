import { PreferenceDialogTabId } from '@/components/preferences/PreferencesDialog';
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
  // 設定ダイアログを開いたときの選択タブ
  preferenceDialogTabId: PreferenceDialogTabId;

  // 最大タブ数
  maxTabNum: number;

  // ファイル検索テキスト入力のタイムアウト
  fileSearchInputTimeoutMs: number;
  // ファイル検索結果を表示するタイムアウト
  fileSearchResultDisplayTimeoutMs: number;
  // イベントハンドラーが古いイベント (e.timeStamp) を受け取ったら無視する閾値 (0チェックしない)
  // WSLで実行するときに timeStamp がおかしいことの対処
  timeoutMsEventTimeStamp: number;

  // FileListのヘッダーサイズ
  fileListHeaderSizes: number[];

  // デフォルトのサムネイルサイズ設定画面
  defaultThumbnailSize: number;

  // フルスクリーン時にマウスカーソルを消す
  hideMouseCursorWhenFullscreen: boolean;
}

type UiState_and_Action = UiState & {
  setField: <K extends keyof UiState>(key: K, value: UiState[K]) => void;
};

export const useUiStore = create<UiState_and_Action>()(
  persist(
    set => ({
      debugPreferenceOn: false,
      preferenceDialogTabId: 'general',
      maxTabNum: 10,

      fileSearchInputTimeoutMs: 2000,
      fileSearchResultDisplayTimeoutMs: 2000,
      timeoutMsEventTimeStamp: 100,

      fileListHeaderSizes: [35, 500, 100, 120, 180],
      defaultThumbnailSize: 128, // THUMBNAIL_SIZE_DEFAULT と書きたいが、初期化前参照エラーになる
      hideMouseCursorWhenFullscreen: true,

      setField: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'ui-state',
    }
  )
);
