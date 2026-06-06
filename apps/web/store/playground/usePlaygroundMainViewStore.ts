import { create } from "zustand";
import type { ProjectTeam } from "@/types/project";

export type MainView = { type: "home" } | { type: "team"; projectSlug: string; team: ProjectTeam };

interface MainViewState {
    view: MainView;
    setView: (view: MainView) => void;
}

export const usePlaygroundMainViewStore = create<MainViewState>((set) => ({
    view: { type: "home" },
    setView: (view) => set({ view }),
}));
