import { create } from "zustand";

export type IssueTarget =
    { board: "llm" } | { board: "custom"; columnId: string; columnTitle: string };

interface CreateIssueState {
    target: IssueTarget | null;
    open: (target: IssueTarget) => void;
    close: () => void;
}

export const useCreateIssueStore = create<CreateIssueState>((set) => ({
    target: null,
    open: (target) => set({ target }),
    close: () => set({ target: null }),
}));
