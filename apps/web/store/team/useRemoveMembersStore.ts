import { create } from "zustand";

export interface RemoveMembersRequest {
    userIds: string[];
    scope: "team" | "org";
}

interface RemoveMembersState {
    pending: RemoveMembersRequest | null;
    requestRemove: (request: RemoveMembersRequest) => void;
    close: () => void;
}

export const useRemoveMembersStore = create<RemoveMembersState>((set) => ({
    pending: null,
    requestRemove: (request) => set({ pending: request }),
    close: () => set({ pending: null }),
}));
