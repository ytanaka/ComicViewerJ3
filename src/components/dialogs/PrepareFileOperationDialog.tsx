import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { getQueryData_getFileInfo1 } from '@/services/tab-file-info';
import { unixTime2str } from '@/lib/tools/string-util';
import { usePrepareFileOperationStore } from '@/store/prepare-file-operation-store';

// ダイアログの表示モード
export type PrepareFileOperationDialogType = 'property' | 'prepare_remove' | 'prepare_copy';

// ファイルプロパティ画面、削除／コピー準備画面
export function PrepareFileOperationDialog() {
  const show = useUiVolatileStore(state => state.showPrepareFileOperationDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = usePrepareFileOperationStore(state => state);
  const type = dialogState.type;
  const files = dialogState.files;

  function handleOkCancel(b: boolean) {
    setField('showPrepareFileOperationDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(b);
    }
  }

  function showOkButton() {
    if (type === 'property') return true;
    if (!dialogState.event) return;
    if (!dialogState.event.finished) return false;
    if (dialogState.event.canceled) return false;
    if (dialogState.event.error_msg) return false;
    if (dialogState.event.symlinks !== 0) return false;
    return true;
  }

  function getTitle() {
    switch (type) {
      case 'property':
        return `${files[0]?.name} のプロパティ`;
      case 'prepare_copy':
        return showOkButton() ? 'コピーしますか？' : 'コピー対象を検査中';
      case 'prepare_remove':
        return showOkButton() ? '削除しますか？' : '削除対象を検査中';
      default:
        return '???';
    }
  }

  return (
    <AlertDialog
      open={show}
      onOpenChange={open => {
        if (!open) handleOkCancel(false)
      }}
    >
      <AlertDialogContent className="max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription className="max-w-full overflow-x-auto">
            <FilePropertyPanel />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {type !== 'property' &&
            <AlertDialogCancel
              onClick={() => handleOkCancel(false)}
            >Cancel</AlertDialogCancel>
          }
          {showOkButton() &&
            <AlertDialogAction
              autoFocus={true}
              onClick={() => handleOkCancel(true)}
            >Ok</AlertDialogAction>
          }
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FilePropertyPanel() {
  const file = usePrepareFileOperationStore(state => state.files[0]);
  if (file.is_dir) {
    return <FilePropertyPanel_dir />;
  } else {
    return <FilePropertyPanel_file />;
  }
}
function FilePropertyPanel_file() {
  const tab = usePrepareFileOperationStore(state => state.tab);
  const file = usePrepareFileOperationStore(state => state.files[0]);
  const fileInfo = getQueryData_getFileInfo1(tab!.id, file.file_id);
  return (
    <>
      {fileInfo?.metadata.Left ? (
        <>{fileInfo.metadata.Left}</>
      ) : fileInfo?.metadata.Right ? (
        <>
          サイズ: {fileInfo.metadata.Right.size?.toLocaleString()}<br />
          更新日時: {unixTime2str(fileInfo.metadata.Right.modified)}<br />
        </>
      ) : (
        <></>
      )}
    </>
  )
}
function FilePropertyPanel_dir() {
  const tab = usePrepareFileOperationStore(state => state.tab);
  const property = usePrepareFileOperationStore(state => state.event);
  const file = usePrepareFileOperationStore(state => state.files[0]);
  const fileInfo = getQueryData_getFileInfo1(tab!.id, file.file_id);
  return (
    <>
      {fileInfo?.metadata.Left ? (
        <>{fileInfo.metadata.Left}</>
      ) : fileInfo?.metadata.Right ? (
        <>
          更新日時: {unixTime2str(fileInfo.metadata.Right.modified)}<br />
        </>
      ) : (
        <></>
      )}
      <br />
      サイズ: ({property?.size.toLocaleString()} バイト)
      <br />
      ファイル数: {property?.files.toLocaleString()}
      <br />
      ディレクトリ数: {property?.dires.toLocaleString()}
      {property?.symlinks !== 0 && <><br />リンク数: {property?.symlinks.toLocaleString()}</>}
    </>
  )
}
