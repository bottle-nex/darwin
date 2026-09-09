import { ColorScheme as StoredColorScheme } from "@trydarwin/types";
import { useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiClient } from "@/lib/axios";
import { USER_CONFIG_URL } from "@/routes/api_routes";

export type ColorScheme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export const PLAYGROUND_THEME_STORAGE_KEY = "playground-theme";

const SCHEMES: ColorScheme[] = ["dark", "light", "system"];

export const STORED_SCHEME: Record<ColorScheme, StoredColorScheme> = {
    dark: StoredColorScheme.Dark,
    light: StoredColorScheme.Light,
    system: StoredColorScheme.System,
};

export const SCHEME_FROM_STORED: Record<StoredColorScheme, ColorScheme> = {
    [StoredColorScheme.Dark]: "dark",
    [StoredColorScheme.Light]: "light",
    [StoredColorScheme.System]: "system",
};

function isScheme(value: unknown): value is ColorScheme {
    return typeof value === "string" && (SCHEMES as string[]).includes(value);
}

interface PlaygroundThemeState {
    scheme: ColorScheme;
    systemPrefersDark: boolean;
    setScheme: (scheme: ColorScheme) => void;
    setSystemPrefersDark: (prefersDark: boolean) => void;
}

export const usePlaygroundThemeStore = create<PlaygroundThemeState>()(
    persist(
        (set) => ({
            scheme: "dark",
            systemPrefersDark:
                typeof window === "undefined" ||
                window.matchMedia("(prefers-color-scheme: dark)").matches,
            setScheme: (scheme) => set({ scheme }),
            setSystemPrefersDark: (systemPrefersDark) => set({ systemPrefersDark }),
        }),
        {
            name: PLAYGROUND_THEME_STORAGE_KEY,
            version: 2,
            skipHydration: true,
            partialize: (state) => ({ scheme: state.scheme }),
            /* v1 stored a two-way `mode`; without this the old value is dropped. */
            migrate: (persistedState) => {
                const legacy = (persistedState as { mode?: unknown } | undefined)?.mode;
                return { scheme: isScheme(legacy) ? legacy : "dark" };
            },
            merge: (persistedState, currentState) => {
                const stored = (persistedState as { scheme?: unknown } | undefined)?.scheme;
                return { ...currentState, scheme: isScheme(stored) ? stored : currentState.scheme };
            },
        },
    ),
);

export function resolveTheme(scheme: ColorScheme, systemPrefersDark: boolean): ResolvedTheme {
    if (scheme === "system") return systemPrefersDark ? "dark" : "light";
    return scheme;
}

export function usePlaygroundTheme(): ResolvedTheme {
    const fromStore = usePlaygroundThemeStore((state) =>
        resolveTheme(state.scheme, state.systemPrefersDark),
    );
    // Before rehydration the store still says "dark", while ThemeFlashGuard has
    // already put the real theme on the DOM. Anything that colours itself from
    // JS has to agree with the painted class or it renders against the wrong
    // ground for a frame.
    const [painted] = useState<ResolvedTheme | null>(() =>
        typeof document === "undefined"
            ? null
            : document.querySelector(".theme-playground.light")
              ? "light"
              : null,
    );
    const hydrated = usePlaygroundThemeStore.persist.hasHydrated();
    return hydrated ? fromStore : (painted ?? fromStore);
}

/**
 * Tracked for the session rather than per component, because the dashboard
 * query stays cached for a minute after a change: a toggle that remounted
 * inside that window would otherwise read the pre-change value back and revert
 * the theme under the user.
 */
let accountSchemeSettled = false;

/**
 * The one way to change theme. Paints immediately from the store, then writes
 * the choice to the account so it follows the user to their other devices.
 * Both the settings toggle and the command palette go through here.
 */
export function changeColorScheme(scheme: ColorScheme) {
    accountSchemeSettled = true;
    usePlaygroundThemeStore.getState().setScheme(scheme);
    void apiClient.patch(USER_CONFIG_URL, { colorScheme: STORED_SCHEME[scheme] }).catch(() => {});
}

/** Lets the account's saved choice win once per session, over this device's cache. */
export function adoptAccountScheme(stored: StoredColorScheme) {
    if (accountSchemeSettled) return;
    const scheme = SCHEME_FROM_STORED[stored];
    if (!scheme) return;
    accountSchemeSettled = true;
    if (scheme !== usePlaygroundThemeStore.getState().scheme) {
        usePlaygroundThemeStore.getState().setScheme(scheme);
    }
}
