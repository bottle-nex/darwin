import { create } from "zustand";

export type MyIssuesView = "assigned" | "created";

interface MyIssuesOptionsState {
    view: MyIssuesView;
    setView: (view: MyIssuesView) => void;
}

export const useMyIssuesOptionsStore = create<MyIssuesOptionsState>((set) => ({
    view: "assigned",
    setView: (view) => set({ view }),
}));
