import { create } from "zustand";

interface RevokeInvitesState {
    invitationIds: string[];
    requestRevoke: (invitationIds: string[]) => void;
    close: () => void;
}

const EMPTY: string[] = [];

export const useRevokeInvitesStore = create<RevokeInvitesState>((set) => ({
    invitationIds: EMPTY,
    requestRevoke: (invitationIds) => set({ invitationIds }),
    close: () => set({ invitationIds: EMPTY }),
}));
