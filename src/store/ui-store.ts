import { PreferenceDialogTabId } from '@/components/preferences/PreferencesDialog';
import { getFileExtension } from '@/lib/tools/string-util';
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

export const THUMBNAIL_SIZE_LIST = [64, 96, 128, 192, 256, 384, 512];
export const THUMBNAIL_SIZE_DEFAULT = 128;

export const FONT_FAMILY_LIST = [
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'fangsong',
];
export const DEFAULT_FONT_FAMILY = 'sans-serif';

export const DEFAULT_INVOKE_EXT_LIST = [
  'txt',
  'ini',
  'json',
  'log',
  'zip',
  'html',
  'pdf',
  'xls',
  'xlsx',
  'doc',
  'docx',
  'odt',
  'ods',
];

// localStrage に保存するUIの設定
export interface UiState {
  // 設定画面でデバッグ項目を編集可能にする
  debugPreferenceOn: boolean;
  // 設定ダイアログを開いたときの選択タブ
  preferenceDialogTabId: PreferenceDialogTabId;

  // 最大タブ数
  maxTabNum: number;

  // アプリで使用するフォント
  fontFamily: string;
  fontSize: number;

  // ファイル検索テキスト入力のタイムアウト
  fileSearchInputTimeoutMs: number;
  // ファイル検索結果を表示するタイムアウト
  fileSearchResultDisplayTimeoutMs: number;
  // イベントハンドラーが古いイベント (e.timeStamp) を受け取ったら無視する閾値 (0チェックしない)
  // WSLで実行するときに timeStamp がおかしいことの対処
  timeoutMsEventTimeStamp: number;

  // FileListのヘッダーサイズ
  fileListHeaderSizes: number[];

  // フルスクリーン時にマウスカーソルを消す
  hideMouseCursorWhenFullscreen: boolean;

  // OSの機能で起動できるファイルの拡張子
  invokeByOsExt: string[];
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

      fontFamily: DEFAULT_FONT_FAMILY,
      fontSize: 0,

      fileSearchInputTimeoutMs: 2000,
      fileSearchResultDisplayTimeoutMs: 2000,
      timeoutMsEventTimeStamp: 100,

      fileListHeaderSizes: [35, 500, 100, 120, 180],
      hideMouseCursorWhenFullscreen: true,

      invokeByOsExt: DEFAULT_INVOKE_EXT_LIST,

      setField: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'ui-state',
    }
  )
);

export function getUIStore_checkInvokeByOsExt(filename: string): boolean {
  const extList = useUiStore.getState().invokeByOsExt;
  const ext = getFileExtension(filename)?.toLowerCase() ?? '';
  return !!extList.find(s => s === ext.toLowerCase())
}
