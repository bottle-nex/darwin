import { create } from "zustand";

interface AddCustomColumnState {
    open: boolean;
    targetSpaceId: string | null;
    openFor: (spaceId: string) => void;
    setOpen: (open: boolean) => void;
}

/** Open state for the "Add custom column" dialog, and the space it adds to. */
export const useAddCustomColumnStore = create<AddCustomColumnState>((set) => ({
    open: false,
    targetSpaceId: null,
    openFor: (spaceId) => set({ open: true, targetSpaceId: spaceId }),
    setOpen: (open) => set({ open }),
}));
