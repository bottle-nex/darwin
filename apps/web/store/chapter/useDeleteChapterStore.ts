import { create } from "zustand";

import type { BoardChapter } from "@/types/board";

interface DeleteChapterState {
    chapter: BoardChapter | null;
    requestDelete: (chapter: BoardChapter) => void;
    close: () => void;
}

export const useDeleteChapterStore = create<DeleteChapterState>((set) => ({
    chapter: null,
    requestDelete: (chapter) => set({ chapter }),
    close: () => set({ chapter: null }),
}));
