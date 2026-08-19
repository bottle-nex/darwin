import { create } from "zustand";

export type MyIssuesView = "assigned" | "created";
export type MyIssuesGroup = "status" | "priority" | "none";
export type MyIssuesOrder = "newest" | "oldest" | "priority" | "number";

interface MyIssuesOptionsState {
    view: MyIssuesView;
    groupBy: MyIssuesGroup;
    orderBy: MyIssuesOrder;
    setView: (view: MyIssuesView) => void;
    setGroupBy: (groupBy: MyIssuesGroup) => void;
    setOrderBy: (orderBy: MyIssuesOrder) => void;
}

export const useMyIssuesOptionsStore = create<MyIssuesOptionsState>((set) => ({
    view: "assigned",
    groupBy: "status",
    orderBy: "newest",
    setView: (view) => set({ view }),
    setGroupBy: (groupBy) => set({ groupBy }),
    setOrderBy: (orderBy) => set({ orderBy }),
}));
