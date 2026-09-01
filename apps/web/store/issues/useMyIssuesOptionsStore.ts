import { create } from "zustand";

export type MyIssuesView = "assigned" | "created";

interface MyIssuesOptionsState {
    view: MyIssuesView;
    setView: (view: MyIssuesView) => void;
}

/** Which slice of My Issues is shown. Layout and grouping are saved per user — see `useIssueView`. */
export const useMyIssuesOptionsStore = create<MyIssuesOptionsState>((set) => ({
    view: "assigned",
    setView: (view) => set({ view }),
}));
