import { create } from "zustand";

interface HoveredIssueState {
    id: string | null;
    setHovered: (id: string | null) => void;
}

export const useHoveredIssueStore = create<HoveredIssueState>((set) => ({
    id: null,
    setHovered: (id) => set((state) => (state.id === id ? state : { id })),
}));
