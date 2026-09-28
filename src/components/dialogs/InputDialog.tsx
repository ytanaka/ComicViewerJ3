import { useEffect, useState } from 'react';
import { create } from 'zustand';

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
import { Input } from '../ui/input';

import { useUiVolatileStore } from '@/store/ui-volatile-store';

export function InputDialog() {
  const show = useUiVolatileStore(state => state.showInputDialog);
  const setField = useUiVolatileStore(state => state.setField);
  const dialogState = useInputDialogStore(state => state);
  const [value, setValue] = useState('');

  useEffect(() => {
    const def = async () => {
      setValue(dialogState.defaultValue);
    };
    def();
  }, [dialogState.defaultValue, dialogState.timestamp]);

  function handleInput(s: string | null) {
    setField('showInputDialog', false);
    if (dialogState.resolve) {
      dialogState.resolve(s);
    }
  }

  return (
    <AlertDialog
      open={show}
      onOpenChange={open => {
        if (!open) handleInput(null);
      }}
    >
      <AlertDialogContent className="max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          <AlertDialogDescription className="max-w-full overflow-x-auto">
            {dialogState.msg.split('\n').map((s, i) => (
              <span key={i} className="whitespace-nowrap">
                {s}
                <br />
              </span>
            ))}
          </AlertDialogDescription>
          <Input
            autoFocus={true}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              e.stopPropagation();
              handleInput(value);
            }}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleInput(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleInput(value)}>Ok</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface InputDialogStore {
  title: string;
  msg: string;
  defaultValue: string;
  timestamp: number;
  resolve: ((value: string | null) => void) | null;

  showDialog: (title: string, msg: string, defaultValue: string, resolve: (value: string | null) => void) => void;
}
export const useInputDialogStore = create<InputDialogStore>()(set => ({
  title: '',
  msg: '',
  defaultValue: '',
  timestamp: 0,
  resolve: null,

  showDialog: (title: string, msg: string, defaultValue: string, resolve: (value: string | null) => void) => {
    useUiVolatileStore.getState().setField('showInputDialog', true);

    set(() => {
      return {
        title,
        msg,
        defaultValue,
        timestamp: new Date().getTime(),
        resolve,
      };
    });
  },
}));
