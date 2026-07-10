import { create } from "zustand";

export type IssueTarget =
    { board: "llm" } | { board: "custom"; columnId: string; columnTitle: string };

/**
 * Creating needs an explicit target. Editing doesn't — the issue already knows
 * where it lives, so the target is derived from its `customColumnId`.
 */
export type IssueDialogMode =
    { kind: "create"; target: IssueTarget } | { kind: "edit"; issueId: string };

interface CreateOrEditIssueState {
    mode: IssueDialogMode | null;
    openCreate: (target: IssueTarget) => void;
    openEdit: (issueId: string) => void;
    close: () => void;
}

export const useCreateOrEditIssueStore = create<CreateOrEditIssueState>((set) => ({
    mode: null,
    openCreate: (target) => set({ mode: { kind: "create", target } }),
    openEdit: (issueId) => set({ mode: { kind: "edit", issueId } }),
    close: () => set({ mode: null }),
}));
