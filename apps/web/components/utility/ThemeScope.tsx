"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const SCOPE_CLASSES = ["theme-landing", "theme-playground"];

const PLAYGROUND_ROUTES = ["/playground", "/workspace"];

/**
 * Radix portals (Dialog/Sheet/DropdownMenu/Popover/Select) and the sonner
 * Toaster mount as direct children of <body>, outside the per-route wrapper
 * div that carries the landing/playground scope class — so this mirrors the
 * active scope onto <body> itself, keyed off the route.
 */
export default function ThemeScope() {
    const pathname = usePathname();

    useLayoutEffect(() => {
        const scope = PLAYGROUND_ROUTES.some((route) => pathname?.startsWith(route))
            ? "theme-playground"
            : "theme-landing";
        document.body.classList.remove(...SCOPE_CLASSES);
        document.body.classList.add(scope);
    }, [pathname]);

    return null;
}
