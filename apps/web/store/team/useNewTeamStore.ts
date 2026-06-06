import { create } from "zustand";

interface NewTeamState {
    open: boolean;
    targetProjectId: string | null;
    setOpen: (open: boolean) => void;
    setTargetProjectId: (id: string | null) => void;
}

export const useNewTeamStore = create<NewTeamState>((set) => ({
    open: false,
    targetProjectId: null,
    setOpen: (open) => set({ open }),
    setTargetProjectId: (targetProjectId) => set({ targetProjectId }),
}));
