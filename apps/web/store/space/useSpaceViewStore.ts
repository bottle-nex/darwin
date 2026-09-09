import { create } from "zustand";

export type SpaceView = "overview" | "issues";

interface SpaceViewState {
    spaceId: string | null;
    view: SpaceView;
    show: (spaceId: string, view: SpaceView) => void;
}

export const useSpaceViewStore = create<SpaceViewState>((set) => ({
    spaceId: null,
    view: "overview",
    show: (spaceId, view) => set({ spaceId, view }),
}));
