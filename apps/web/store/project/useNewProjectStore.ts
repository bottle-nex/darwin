import { create } from "zustand";

interface NewProjectState {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const useNewProjectStore = create<NewProjectState>((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
}));
