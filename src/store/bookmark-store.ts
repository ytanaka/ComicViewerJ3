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
  moveBookmark: (i: number, upDown: number) => void;
}

export const useBookmarkStore = create<BookmarkStor_and_Action>()(
  persist(immer(set => ({
    list: [],
    focusIndex: 0,

    setFocus: (i: number) => {
      set(state => {
        state.focusIndex = i;
      })
    },
    addBookmark: (b: Bookmark) => {
      set(state => {
        state.list = [...state.list, b];
      })
    },

    moveBookmark: (i: number, upDown: number) => {
      set(state => {
        if (i <= 0 && upDown < 0) return state;
        if (state.list.length - 1 <= i && 0 < upDown) return state;
        if (upDown === 0) return state;

        const b = state.list.splice(i);
        if (upDown < 0) {
          state.list.splice(i - 1, 0, b[0]);
        } else {
          state.list.splice(i + 1, 0, b[0]);
        }
      })
    },
  })),
    {
      name: 'bookmark-store',
    }
  )
);
