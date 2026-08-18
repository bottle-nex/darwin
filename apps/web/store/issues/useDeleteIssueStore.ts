import { create } from "zustand";

interface DeleteIssueState {
    issueId: string | null;
    requestDelete: (issueId: string) => void;
    close: () => void;
}

export const useDeleteIssueStore = create<DeleteIssueState>((set) => ({
    issueId: null,
    requestDelete: (issueId) => set({ issueId }),
    close: () => set({ issueId: null }),
}));
