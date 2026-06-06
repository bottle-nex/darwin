import { create } from "zustand";
import type { ProjectTeam } from "@/types/project";

interface DeleteTeamState {
    team: ProjectTeam | null;
    requestDelete: (team: ProjectTeam) => void;
    close: () => void;
}

export const useDeleteTeamStore = create<DeleteTeamState>((set) => ({
    team: null,
    requestDelete: (team) => set({ team }),
    close: () => set({ team: null }),
}));
