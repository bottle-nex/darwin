import { create } from "zustand";

interface SolveReportState {
    issueId: string | null;
    open: (issueId: string) => void;
    close: () => void;
}

export const useSolveReportStore = create<SolveReportState>((set) => ({
    issueId: null,
    open: (issueId) => set({ issueId }),
    close: () => set({ issueId: null }),
}));
