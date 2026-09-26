import { getPlatform } from '@/hooks/use-platform';
import { programCommands } from '@/lib/commands/program-commands';
import { AppHotkey, AppMenuItem } from '@/lib/menu-items';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const MAX_EXTERNAL_PROGRAMS = 10;

export interface ExternalProgramState {
  list: ExternalProgram[];

  add: (p: ExternalProgram) => void;
  remove: (i: number) => void;
  swap: (i1: number, i2: number) => void;
  update: (i: number, p: ExternalProgram) => void;
}

export interface ExternalProgram {
  name: string;
  command: string;
  maxSelectionLimit: number;
  debugPrompt: boolean;
}

export const useExternalProgramStore = create<ExternalProgramState>()(
  persist(
    immer(set => ({
      list: [],

      add: (p: ExternalProgram) => {
        set(state => {
          if (state.list.length < MAX_EXTERNAL_PROGRAMS) {
            state.list.push(p);
          }
          return state;
        });
      },
      remove: (i: number) => {
        set(state => {
          if (0 <= i && i < state.list.length) {
            state.list.splice(i, 1);
          }
          return state;
        });
      },
      swap: (i1: number, i2: number) => {
        set(state => {
          const p1 = state.list[i1];
          const p2 = state.list[i2];
          if (p1 && p2) {
            state.list[i1] = p2;
            state.list[i2] = p1;
          }
          return state;
        });
      },
      update: (i: number, p: ExternalProgram) => {
        set(state => {
          const old = state.list[i];
          if (old) {
            state.list[i] = p;
          }
          return state;
        });
      },
    })),
    {
      name: 'external-program-state',
    }
  )
);

export function getProgramMenu(index: number): AppMenuItem {
  const p = useExternalProgramStore.getState().list[index];
  return {
    value: p.name,
    exec: () => programCommands.startProgram(index),
    hotkey: new AppHotkey(`Ctrl//${index}`),
  };
}

export function getExternalProgramExamples(): ExternalProgram[] {
  if (getPlatform() === 'linux') {
    return getExternalProgramExamples_linux();
  } else {
    return getExternalProgramExamples_windows();
  }
}
function getExternalProgramExamples_windows(): ExternalProgram[] {
  return [
    {
      name: 'メモ帳で開く',
      command: 'notepad.exe\n${files}',
      debugPrompt: true,
      maxSelectionLimit: 1,
    },
    {
      name: 'Visual Studio Codeで選択されたファイル／ディレクトリを開く',
      command: 'code.cmd\n${files}',
      debugPrompt: true,
      maxSelectionLimit: 1,
    },
    {
      name: 'Windows Terminalでカレントディレクトリを開く',
      command: 'wt.exe\n-d\n${dir}\n--profile\nGit Bash',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
    {
      name: 'エクスプローラーでカレントディレクトリを開く',
      command: 'explorer.exe\n${dir}',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
    {
      name: 'Git GUI を開く',
      command: 'git-gui.exe',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
    {
      name: 'gitk を開く',
      command: 'gitk.exe',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
  ]
}

function getExternalProgramExamples_linux(): ExternalProgram[] {
  return [
    {
      name: 'geditで開く',
      command: 'gedit\n${files}',
      debugPrompt: true,
      maxSelectionLimit: 1,
    },
    {
      name: 'Visual Studio Codeで選択されたファイル／ディレクトリを開く',
      command: 'code\n${files}',
      debugPrompt: true,
      maxSelectionLimit: 1,
    },
    {
      name: 'Gnome Terminalでカレントディレクトリを開く',
      command: 'gnome-terminal\n--working-directory=${dir}',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
    {
      name: '"ファイル"でカレントディレクトリを開く',
      command: 'nautilus\n${dir}',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
    {
      name: 'Git GUI を開く',
      command: 'git\ngui',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
    {
      name: 'gitk を開く',
      command: 'gitk',
      debugPrompt: true,
      maxSelectionLimit: 0,
    },
  ]
}