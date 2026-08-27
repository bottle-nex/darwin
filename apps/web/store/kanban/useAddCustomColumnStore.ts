import { create } from "zustand";

interface AddCustomColumnState {
    open: boolean;
    targetChapterId: string | null;
    openFor: (chapterId: string) => void;
    setOpen: (open: boolean) => void;
}

/** Open state for the "Add custom column" dialog, and the chapter it adds to. */
export const useAddCustomColumnStore = create<AddCustomColumnState>((set) => ({
    open: false,
    targetChapterId: null,
    openFor: (chapterId) => set({ open: true, targetChapterId: chapterId }),
    setOpen: (open) => set({ open }),
}));
