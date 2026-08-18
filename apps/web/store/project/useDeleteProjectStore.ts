import { create } from "zustand";
import type { Project } from "@/types/project";

interface DeleteProjectState {
    project: Project | null;
    requestDelete: (project: Project) => void;
    close: () => void;
}

export const useDeleteProjectStore = create<DeleteProjectState>((set) => ({
    project: null,
    requestDelete: (project) => set({ project }),
    close: () => set({ project: null }),
}));
