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

import { useGetFilesPropertyStore } from '@/store/get-files-property-store';
import { useUiVolatileStore } from '@/store/ui-volatile-store';
import { getQueryData_getFileInfo1 } from '@/services/tab-file-info';
import { unixTime2str } from '@/lib/tools/string-util';

// ダイアログの表示モード
export type FileOperationDialogType = 'property' | 'prepare_remove' | 'prepare_copy';

export function FileOperationDialog() {
  const show = useUiVolatileStore(state => state.showFileOperationDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const dialogState = useGetFilesPropertyStore(state => state);
  const type = dialogState.type;
  const files = dialogState.files;

  function handleOkCancel(b: boolean) {
    setField('showFileOperationDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(b);
    }
  }

  function showOkButton() {
    if (type === 'property') return true;
    if (!dialogState.property?.finished) return false;
    if (dialogState.property.canceled) return false;
    if (dialogState.property.error_msg) return false;
    if (dialogState.property.symlinks !== 0) return false;
    // setFocusOkButton(true);
    return true;
  }

  let title: string;
  switch (type) {
    case 'property':
      title = `${files[0]?.name} のプロパティ`;
      break;
    case 'prepare_copy':
      title = showOkButton() ? 'コピーしますか？' : 'コピー対象を検査中';
      break;
    case 'prepare_remove':
      title = showOkButton() ? '削除しますか？' : '削除対象を検査中';
      break;
    default:
      title = '???';
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
          <AlertDialogTitle>{title}</AlertDialogTitle>
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
  const file = useGetFilesPropertyStore(state => state.files[0]);
  if (file.is_dir) {
    return <FilePropertyPanel_dir />;
  } else {
    return <FilePropertyPanel_file />;
  }
}
function FilePropertyPanel_file() {
  const tab = useGetFilesPropertyStore(state => state.tab);
  const file = useGetFilesPropertyStore(state => state.files[0]);
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
  const tab = useGetFilesPropertyStore(state => state.tab);
  const property = useGetFilesPropertyStore(state => state.property);
  const file = useGetFilesPropertyStore(state => state.files[0]);
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
