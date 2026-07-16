import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SIDEBAR_MIN_WIDTH = 208;
export const SIDEBAR_MAX_WIDTH = 320;
export const SIDEBAR_DEFAULT_WIDTH = 240;
export const SIDEBAR_WIDTH_CSS_VAR = "--playground-sidebar-width";
export const SIDEBAR_WIDTH_STORAGE_KEY = "playground-sidebar-width";

const clampWidth = (width: number) =>
    Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));

const applyWidthVar = (width: number) =>
    document.documentElement.style.setProperty(SIDEBAR_WIDTH_CSS_VAR, `${width}px`);

interface SidebarWidthState {
    width: number;
    setWidth: (width: number) => void;
}

export const useSidebarWidthStore = create<SidebarWidthState>()(
    persist(
        (set) => ({
            width: SIDEBAR_DEFAULT_WIDTH,
            setWidth: (width) => {
                const clamped = clampWidth(width);
                applyWidthVar(clamped);
                set({ width: clamped });
            },
        }),
        {
            name: SIDEBAR_WIDTH_STORAGE_KEY,
            skipHydration: true,
            onRehydrateStorage: () => (state) => {
                if (state) applyWidthVar(state.width);
            },
        },
    ),
);
