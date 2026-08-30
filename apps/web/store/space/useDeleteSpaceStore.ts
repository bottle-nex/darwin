import { create } from "zustand";

interface DeleteSpaceState {
    /** Ids only — the dialog resolves them, so callers outside React can ask. */
    spaceIds: string[];
    requestDelete: (...spaceIds: string[]) => void;
    close: () => void;
}

const EMPTY: string[] = [];

export const useDeleteSpaceStore = create<DeleteSpaceState>((set) => ({
    spaceIds: EMPTY,
    requestDelete: (...spaceIds) => set({ spaceIds }),
    close: () => set({ spaceIds: EMPTY }),
}));
