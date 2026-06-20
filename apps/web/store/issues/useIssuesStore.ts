"use client";
import { create } from "zustand";
import type { Issue } from "@trymatcha/types";

interface IssuesStoreType {
    realtime_issues: Issue[];
    add_realtime_issue: (issue: Issue) => void;
    clear_realtime_issues: () => void;
}

export const useIssuesStore = create<IssuesStoreType>((set) => ({
    realtime_issues: [],
    add_realtime_issue: (issue) =>
        set((state) => ({ realtime_issues: [...state.realtime_issues, issue] })),
    clear_realtime_issues: () => set({ realtime_issues: [] }),
}));
