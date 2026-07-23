import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SIDEBAR_MIN_WIDTH = 208;
export const SIDEBAR_MAX_WIDTH = 320;
export const SIDEBAR_DEFAULT_WIDTH = 240;
export const SIDEBAR_COLLAPSE_THRESHOLD = 30;
export const SIDEBAR_WIDTH_CSS_VAR = "--playground-sidebar-width";
export const SIDEBAR_WIDTH_STORAGE_KEY = "playground-sidebar-width";

const clampWidth = (width: number) =>
    Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));

const applyWidthVar = (width: number) =>
    document.documentElement.style.setProperty(SIDEBAR_WIDTH_CSS_VAR, `${width}px`);

interface SidebarWidthState {
    width: number;
    collapsed: boolean;
    dragging: boolean;
    sheetOpen: boolean;
    setWidth: (width: number) => void;
    collapse: () => void;
    expand: () => void;
    toggle: () => void;
    setDragging: (dragging: boolean) => void;
    openSheet: () => void;
    closeSheet: () => void;
}

export const useSidebarWidthStore = create<SidebarWidthState>()(
    persist(
        (set, get) => ({
            width: SIDEBAR_DEFAULT_WIDTH,
            collapsed: false,
            dragging: false,
            sheetOpen: false,
            setWidth: (width) => {
                const clamped = clampWidth(width);
                applyWidthVar(clamped);
                set({ width: clamped, collapsed: false, sheetOpen: false });
            },
            collapse: () => {
                applyWidthVar(0);
                set({ collapsed: true });
            },
            expand: () => {
                applyWidthVar(get().width);
                set({ collapsed: false, sheetOpen: false });
            },
            toggle: () => (get().collapsed ? get().expand() : get().collapse()),
            setDragging: (dragging) => set({ dragging }),
            openSheet: () => set({ sheetOpen: true }),
            closeSheet: () => set({ sheetOpen: false }),
        }),
        {
            name: SIDEBAR_WIDTH_STORAGE_KEY,
            skipHydration: true,
            partialize: (state) => ({ width: state.width, collapsed: state.collapsed }),
            onRehydrateStorage: () => (state) => {
                if (state) applyWidthVar(state.collapsed ? 0 : state.width);
            },
        },
    ),
);
