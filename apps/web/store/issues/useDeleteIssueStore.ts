import { create } from "zustand";

interface DeleteIssueState {
    issueIds: string[];
    requestDelete: (target: string | string[]) => void;
    close: () => void;
}

export const useDeleteIssueStore = create<DeleteIssueState>((set) => ({
    issueIds: [],
    requestDelete: (target) => set({ issueIds: Array.isArray(target) ? target : [target] }),
    close: () => set({ issueIds: [] }),
}));
