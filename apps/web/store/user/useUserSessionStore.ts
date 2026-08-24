import type { Session } from "next-auth";
import { create } from "zustand";

interface UserSessionStoreType {
    session: Session | null;
    openLogoutModal: boolean;

    tutorialComplete: boolean | null;
    setTutorialComplete: (val: boolean) => void;

    setOpenLogoutModal: (open: boolean) => void;
    setSession: (data: Session | null) => void;
}

export const useUserSessionStore = create<UserSessionStoreType>((set) => ({
    session: null,
    openLogoutModal: false,
    tutorialComplete: null,

    setSession: (data: Session | null) => set({ session: data }),
    setOpenLogoutModal: (open: boolean) => set({ openLogoutModal: open }),

    setTutorialComplete: (val: boolean) => set({ tutorialComplete: val }),
}));
