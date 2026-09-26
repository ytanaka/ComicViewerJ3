import { useUiVolatileStore } from '@/store/ui-volatile-store';
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
import { create } from 'zustand';

export function OkCancelDialog() {
  const show = useUiVolatileStore(state => state.showOkCancelDialog);
  const setField = useUiVolatileStore(state => state.setField);
  const dialogState = useOkCancelDialogStore(state => state);

  function handleOkCancel(b: boolean) {
    setField('showOkCancelDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(b);
    }
  }

  return (
    <AlertDialog
      open={show}
      onOpenChange={open => {
        if (!open) handleOkCancel(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogState.msg.split('\n').map((s, i) => (
              <span key={i}>{s}<br /></span>
            ))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleOkCancel(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction autoFocus={true} onClick={() => handleOkCancel(true)}>
            Ok
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface OkCancelDialogStore {
  title: string;
  msg: string;
  resolve: ((value: boolean) => void) | null;

  showDialog: (title: string, msg: string, resolve: (value: boolean) => void) => void;
}
export const useOkCancelDialogStore = create<OkCancelDialogStore>()(set => ({
  msg: '',
  title: '',
  resolve: null,

  showDialog: (title: string, msg: string, resolve: (value: boolean) => void) => {
    useUiVolatileStore.getState().setField('showOkCancelDialog', true);

    set(() => {
      return {
        title,
        msg,
        resolve,
      };
    });
  },
}));
