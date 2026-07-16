import { create } from "zustand";

interface AddCustomColumnState {
    open: boolean;
    setOpen: (open: boolean) => void;
}

/** Open state for the "Add custom column" dialog, triggered from the Add Task menu. */
export const useAddCustomColumnStore = create<AddCustomColumnState>((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
}));
