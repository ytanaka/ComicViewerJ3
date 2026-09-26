import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const MAX_EXTERNAL_PROGRAMS = 10;

export interface ExternalProgramState {
  list: ExternalProgram[];

  add: (p: ExternalProgram) => void;
  remove: (i: number) => void;
  swap: (i1: number, i2: number) => void;
  update: (i: number, p: ExternalProgram) => void;
}

export interface ExternalProgram {
  name: string,
  command: string,
  maxSelectionLimit: number,
  debugPrompt: boolean,
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
        })
      },
      remove: (i: number) => {
        set(state => {
          if (0 <= i && i < state.list.length) {
            state.list.splice(i, 1);
          }
          return state;
        })
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
        })
      },
      update: (i: number, p: ExternalProgram) => {
        set(state => {
          const old = state.list[i];
          if (old) {
            state.list[i] = p;
          }
          return state;
        })
      },
    })),
    {
      name: 'ui-state',
    }
  )
);

export function mkExternalProgram(): ExternalProgram {
  return {
    name: "メモ帳で開く",
    command: "notepad.exe\n${selected_files}",
    debugPrompt: true,
    maxSelectionLimit: 1,
  };
}
