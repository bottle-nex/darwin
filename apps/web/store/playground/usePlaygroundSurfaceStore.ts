import { create } from "zustand";
import { RailSurface } from "@/components/playground/IconRail/railSurface";

interface PlaygroundSurfaceState {
    surface: RailSurface;
    setSurface: (surface: RailSurface) => void;
}

export const usePlaygroundSurfaceStore = create<PlaygroundSurfaceState>((set) => ({
    surface: RailSurface.Home,
    setSurface: (surface) => set({ surface }),
}));
