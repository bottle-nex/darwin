import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

const applyTheme = (theme: Theme) =>
    document.documentElement.classList.toggle("dark", theme === "dark");

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: "light",
            setTheme: (theme) => {
                applyTheme(theme);
                set({ theme });
            },
            toggleTheme: () => {
                const next: Theme = get().theme === "dark" ? "light" : "dark";
                applyTheme(next);
                set({ theme: next });
            },
        }),
        {
            name: THEME_STORAGE_KEY,
            skipHydration: true,
            onRehydrateStorage: () => (state) => {
                if (state) applyTheme(state.theme);
            },
        },
    ),
);
