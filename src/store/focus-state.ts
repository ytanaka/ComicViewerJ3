import { create } from "zustand";

export interface FocusState {
  doFocus: boolean;

  setFocus: () => void;
  doneFocus: () => void;
}

export const useFocusState = create<FocusState>()(
  (set) => ({
    doFocus: false,

    setFocus: () => set({ doFocus: true }),
    doneFocus: () => set({ doFocus: false }),
  }),
);
