"use client";
import { useEffect } from "react";

import { paneRouteFromPath, usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

export function usePaneRoute({ sync = false }: { sync?: boolean } = {}) {
    const route = usePaneRouteStore((s) => s.route);
    const syncRoute = usePaneRouteStore((s) => s.sync);

    useEffect(() => {
        if (!sync) return;
        const readFromUrl = () => syncRoute(paneRouteFromPath(window.location.pathname));
        readFromUrl();
        window.addEventListener("popstate", readFromUrl);
        return () => window.removeEventListener("popstate", readFromUrl);
    }, [sync, syncRoute]);

    return route;
}
