import { create } from "zustand";
import { FileViewMode } from "./tab/types";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface BookmarkStore {
  list: Bookmark[],
  focusIndex: number,
}

export interface Bookmark {
  dir: string,
  item: string,
  mode: FileViewMode,
}

type BookmarkStor_and_Action = BookmarkStore & {
  setFocus: (i: number) => void;
  addBookmark: (b: Bookmark) => void;
  removeBookmark: (i: number) => void;
  moveBookmark: (i: number, upDown: number) => void;
}

export const useBookmarkStore = create<BookmarkStor_and_Action>()(
  persist(immer(set => ({
    list: [],
    focusIndex: 0,

    setFocus: (i: number) => {
      set(state => {
        state.focusIndex = Math.max(0, Math.min(i, state.list.length - 1));
      })
    },
    addBookmark: (b: Bookmark) => {
      set(state => {
        state.list = [...state.list, b];
        state.focusIndex = state.list.length - 1;
      })
    },
    removeBookmark: (i: number) => {
      set(state => {
        state.list.splice(i, 1);
        state.focusIndex = Math.min(state.focusIndex, state.list.length - 1);
      })
    },

    moveBookmark: (i: number, upDown: number) => {
      set(state => {
        if (i <= 0 && upDown < 0) return state;
        if (state.list.length - 1 <= i && 0 < upDown) return state;
        if (upDown === 0) return state;

        const b = state.list.splice(i, 1);
        if (upDown < 0) {
          state.list.splice(i - 1, 0, b[0]);
          state.focusIndex = i - 1;
        } else {
          state.list.splice(i + 1, 0, b[0]);
          state.focusIndex = i + 1;
        }
      })
    },
  })),
    {
      name: 'bookmark-store',
    }
  )
);
