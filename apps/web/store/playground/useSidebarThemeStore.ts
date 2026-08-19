import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    SIDEBAR_THEME_DEFAULT,
    SIDEBAR_THEME_STORAGE_KEY,
    applySidebarGradient,
    resolveGradientKey,
} from "@/lib/sidebarTheme";
import type { SidebarGradientKey, SidebarTheme } from "@/types/sidebarTheme.type";

const applyCurrentKeyFor = (theme: SidebarTheme) => {
    const gradientKey = resolveGradientKey(theme, new Date().getHours());
    applySidebarGradient(gradientKey);
    return gradientKey;
};

interface SidebarThemeState {
    theme: SidebarTheme;
    gradientKey: SidebarGradientKey | null;
    setTheme: (theme: SidebarTheme) => void;
    refresh: () => void;
}

export const useSidebarThemeStore = create<SidebarThemeState>()(
    persist(
        (set, get) => ({
            theme: SIDEBAR_THEME_DEFAULT,
            gradientKey: null,
            setTheme: (theme) => set({ theme, gradientKey: applyCurrentKeyFor(theme) }),
            refresh: () => set({ gradientKey: applyCurrentKeyFor(get().theme) }),
        }),
        {
            name: SIDEBAR_THEME_STORAGE_KEY,
            skipHydration: true,
            partialize: (state) => ({ theme: state.theme }),
            onRehydrateStorage: () => (state) => state?.refresh(),
        },
    ),
);
