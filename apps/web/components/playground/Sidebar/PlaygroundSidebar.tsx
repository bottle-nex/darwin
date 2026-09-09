"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_PANEL_WIDTH_CSS_VAR,
    SIDEBAR_WIDTH_CSS_VAR,
    useSidebarWidthStore,
} from "@/store/playground/useSidebarWidthStore";

import SidebarContent from "./SidebarContent";

export default function PlaygroundSidebar() {
    const { collapsed, dragging } = useSidebarWidthStore();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setHydrated(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const instant = dragging || !hydrated;

    return (
        <aside
            data-lenis-prevent
            aria-label="Sidebar"
            style={{ width: `var(${SIDEBAR_WIDTH_CSS_VAR}, ${SIDEBAR_DEFAULT_WIDTH}px)` }}
            className={cn(
                "h-full min-h-0 shrink-0 overflow-hidden perspective-distant",
                instant
                    ? "transition-none"
                    : "transition-[width] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]",
            )}
        >
            <motion.div
                initial={false}
                animate={collapsed ? { rotateY: -32, scale: 0.9 } : { rotateY: 0, scale: 1 }}
                transition={{ duration: instant ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: `var(${SIDEBAR_PANEL_WIDTH_CSS_VAR}, ${SIDEBAR_DEFAULT_WIDTH}px)`,
                    transformOrigin: "left center",
                }}
                className={cn(
                    "surface-chrome relative h-full min-h-0 overflow-hidden rounded-lg border-[1.5px]",
                    collapsed && "pointer-events-none",
                )}
            >
                <SidebarContent />
            </motion.div>
        </aside>
    );
}
