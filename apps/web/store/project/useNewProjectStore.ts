import { create } from "zustand";

interface NewProjectState {
    open: boolean;
    /** Org (by slug) the new project should belong to, when opened off-route. */
    targetOrgSlug: string | null;
    /** True right after creating a brand-new org: the dialog can't be dismissed until a project exists. */
    forceCreate: boolean;
    setOpen: (open: boolean) => void;
    setTargetOrgSlug: (slug: string | null) => void;
    setForceCreate: (forceCreate: boolean) => void;
}

export const useNewProjectStore = create<NewProjectState>((set) => ({
    open: false,
    targetOrgSlug: null,
    forceCreate: false,
    setOpen: (open) => set({ open }),
    setTargetOrgSlug: (targetOrgSlug) => set({ targetOrgSlug }),
    setForceCreate: (forceCreate) => set({ forceCreate }),
}));
