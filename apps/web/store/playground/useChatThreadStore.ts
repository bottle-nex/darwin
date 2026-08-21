import { create } from "zustand";

type ChatThreadState = {
    teamId: string | null;
    selectProject: () => void;
    selectTeam: (teamId: string) => void;
};

export const useChatThreadStore = create<ChatThreadState>((set) => ({
    teamId: null,
    selectProject: () => set({ teamId: null }),
    selectTeam: (teamId) => set({ teamId }),
}));
