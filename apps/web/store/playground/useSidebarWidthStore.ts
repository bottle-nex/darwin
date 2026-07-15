import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SIDEBAR_MIN_WIDTH = 208;
export const SIDEBAR_MAX_WIDTH = 320;
export const SIDEBAR_DEFAULT_WIDTH = 240;

const clampWidth = (width: number) =>
    Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));

interface SidebarWidthState {
    width: number;
    setWidth: (width: number) => void;
}

export const useSidebarWidthStore = create<SidebarWidthState>()(
    persist(
        (set) => ({
            width: SIDEBAR_DEFAULT_WIDTH,
            setWidth: (width) => set({ width: clampWidth(width) }),
        }),
        { name: "playground-sidebar-width", skipHydration: true },
    ),
);
