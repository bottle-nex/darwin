"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

import { resolveTheme, usePlaygroundThemeStore } from "@/store/playground/usePlaygroundThemeStore";

const SCOPE_CLASSES = ["theme-landing", "theme-playground"];

const PLAYGROUND_ROUTES = ["/playground", "/workspace"];

/**
 * Radix portals (Dialog/Sheet/DropdownMenu/Popover/Select) and the sonner
 * Toaster mount as direct children of <body>, outside the per-route wrapper
 * div that carries the landing/playground scope class — so this mirrors the
 * active scope onto <body> itself, keyed off the route.
 *
 * The light pilot rides along the same way. Custom properties resolve from the
 * nearest ancestor that declares them, so every element carrying
 * `.theme-playground` — the route wrapper and <body> both — needs the `light`
 * class too, or the wrapper re-asserts the dark values over its own subtree.
 */
export default function ThemeScope() {
    const pathname = usePathname();
    const scheme = usePlaygroundThemeStore((state) => state.scheme);
    const systemPrefersDark = usePlaygroundThemeStore((state) => state.systemPrefersDark);
    const setSystemPrefersDark = usePlaygroundThemeStore((state) => state.setSystemPrefersDark);

    useLayoutEffect(() => {
        usePlaygroundThemeStore.persist.rehydrate();
    }, []);

    useLayoutEffect(() => {
        const query = window.matchMedia("(prefers-color-scheme: dark)");
        setSystemPrefersDark(query.matches);
        const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, [setSystemPrefersDark]);

    useLayoutEffect(() => {
        const scope = PLAYGROUND_ROUTES.some((route) => pathname?.startsWith(route))
            ? "theme-playground"
            : "theme-landing";
        document.body.classList.remove(...SCOPE_CLASSES);
        document.body.classList.add(scope);
    }, [pathname]);

    useLayoutEffect(() => {
        // Read live state rather than this render's closure: on the first pass
        // that closure still holds the pre-rehydration default, so toggling from
        // it would strip the class ThemeFlashGuard just set and flash the wrong
        // theme before the store catches up.
        const live = usePlaygroundThemeStore.getState();
        const isLight = resolveTheme(live.scheme, live.systemPrefersDark) === "light";
        document.querySelectorAll(".theme-playground").forEach((element) => {
            element.classList.toggle("light", isLight);
        });
    }, [pathname, scheme, systemPrefersDark]);

    return null;
}
