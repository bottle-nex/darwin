"use client";
import { AnimatePresence, motion } from "motion/react";
import type { RailSurface } from "../IconRail/railSurface";
import PlaygroundDisplay from "./PlaygroundDisplay";
import PlaygroundSidebar from "../Sidebar/PlaygroundSidebar";
import { cn } from "@/lib/utils";

const SIDEBAR_W = 240;

type PlaygroundWorkspaceProps = {
    surface: RailSurface;
    sidebarCollapsed: boolean;
    onCollapseSidebar: () => void;
};

export default function PlaygroundWorkspace({
    surface,
    sidebarCollapsed,
    onCollapseSidebar,
}: PlaygroundWorkspaceProps) {
    return (
        <div className="flex flex-1 min-w-0 overflow-hidden rounded-lg ring-1 ring-white/6 bg-cement/60 backdrop-blur-md">
            <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                    <motion.div
                        key="sidebar"
                        initial={{ width: 0 }}
                        animate={{ width: SIDEBAR_W }}
                        exit={{ width: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        className={cn(
                            "h-full shrink-0 overflow-hidden bg-charcoal", 
                            // "bg-[linear-gradient(180deg,#CDBFF233_0%,#9C82E833_5%,#6E4FD133_10%)]"
                        )} 
                    >
                        <PlaygroundSidebar surface={surface} onCollapse={onCollapseSidebar} />
                    </motion.div>
                )}
            </AnimatePresence>
            <PlaygroundDisplay />
        </div>
    );
}
