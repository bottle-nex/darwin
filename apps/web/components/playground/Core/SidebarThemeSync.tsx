"use client";
import { useEffect, useLayoutEffect } from "react";
import { useSidebarTheme } from "@/hooks/user/useSidebarTheme";
import { useSidebarThemeStore } from "@/store/playground/useSidebarThemeStore";

const REAPPLY_INTERVAL_MS = 5 * 60 * 1000;

export default function SidebarThemeSync() {
    const { data } = useSidebarTheme();
    const setTheme = useSidebarThemeStore((s) => s.setTheme);
    const refresh = useSidebarThemeStore((s) => s.refresh);

    useLayoutEffect(() => {
        useSidebarThemeStore.persist.rehydrate();
    }, []);

    useEffect(() => {
        if (data && data.sidebarTheme !== useSidebarThemeStore.getState().theme) {
            setTheme(data.sidebarTheme);
        }
    }, [data, setTheme]);

    useEffect(() => {
        const interval = setInterval(refresh, REAPPLY_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [refresh]);

    return null;
}
