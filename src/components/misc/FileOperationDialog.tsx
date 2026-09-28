import { useGetFilesPropertyStore } from '@/store/get-files-property-store';
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

// ダイアログの表示モード
export type FileOperationDialogType = 'property' | 'prepare_remove' | 'prepare_copy';

export function FileOperationDialog() {
  const show = useUiVolatileStore(state => state.showFileOperationDialog);
  const setField = useUiVolatileStore(state => state.setField);

  const property = useGetFilesPropertyStore(state => state.property);
  const files = useGetFilesPropertyStore(state => state.files);
  const type = useGetFilesPropertyStore(state => state.type);

  let title: string;
  switch (type) {
    case 'property':
      title = `${files[0]?.name} のプロパティ`;
      break;
    case 'prepare_copy':
      title = 'コピー対象を検査中';
      break;
    case 'prepare_remove':
      title = '削除対象を検査中';
      break;
    default:
      title = '???';
  }

  return (
    <AlertDialog open={show} onOpenChange={open => setField('showFileOperationDialog', open)}>
      <AlertDialogContent className="max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="max-w-full overflow-x-auto">
            size={property?.size}
            <br />
            dirs={property?.dires}
            <br />
            files={property?.files}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Ok</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
