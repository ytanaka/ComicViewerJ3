import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ImageScrollState {
  dragging: boolean;
  start: ImageScrollStartState;

  setDragging: (b: boolean) => void;
  setStart: (st: ImageScrollStartState) => void;
}
export interface ImageScrollStartState {
  x: number;
  y: number;
  left: number;
  top: number;
}

export const useImageScrollState = create<ImageScrollState>()(
  immer(set => ({
    dragging: false,
    start: { x: 0, y: 0, left: 0, top: 0 },

    setDragging: (b: boolean) => {
      set(state => {
        state.dragging = b;
      });
    },

    setStart: (st: ImageScrollStartState) => {
      set(state => {
        state.start = st;
      });
    },
  }))
);
