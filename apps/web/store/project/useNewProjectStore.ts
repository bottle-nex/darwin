import { create } from "zustand";

interface NewProjectState {
    open: boolean;
    /** Org (by slug) the new project should belong to, when opened off-route. */
    targetOrgSlug: string | null;
    setOpen: (open: boolean) => void;
    setTargetOrgSlug: (slug: string | null) => void;
}

export const useNewProjectStore = create<NewProjectState>((set) => ({
    open: false,
    targetOrgSlug: null,
    setOpen: (open) => set({ open }),
    setTargetOrgSlug: (targetOrgSlug) => set({ targetOrgSlug }),
}));
