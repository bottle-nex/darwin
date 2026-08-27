import { create } from "zustand";

interface NewChapterState {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const useNewChapterStore = create<NewChapterState>((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
}));
