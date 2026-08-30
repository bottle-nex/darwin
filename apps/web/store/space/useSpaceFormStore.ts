import { create } from "zustand";

interface SpaceFormState {
    open: boolean;
    /** Id of the space being edited; `null` means the form is creating a new one. */
    spaceId: string | null;
    openCreate: () => void;
    openEdit: (spaceId: string) => void;
    close: () => void;
}

export const useSpaceFormStore = create<SpaceFormState>((set) => ({
    open: false,
    spaceId: null,
    openCreate: () => set({ open: true, spaceId: null }),
    openEdit: (spaceId) => set({ open: true, spaceId }),
    close: () => set({ open: false, spaceId: null }),
}));
