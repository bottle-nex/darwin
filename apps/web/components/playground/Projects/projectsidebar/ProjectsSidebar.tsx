"use client";
import { AnimatePresence, motion } from "motion/react";
import type { SidebarSectionProps } from "../../sidebar/shared";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import ProjectsSection from "./ProjectsSection";
import ProjectNav from "./ProjectNav";

/**
 * Projects sidebar. Two faces, chosen by the sidebar mode: the project list, or —
 * once a project is opened — that project's nav. Cross-fades between the two so
 * opening a project / going back feels continuous.
 */
export default function ProjectsSidebar(props: SidebarSectionProps) {
    const inProject = usePlaygroundNavStore((s) => s.projectsSidebarMode) === "nav";

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={inProject ? "nav" : "list"}
                // The list lives on the left, a project's nav on the right — each
                // enters from and exits to its own side.
                initial={{ opacity: 0, x: inProject ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: inProject ? 10 : -10 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            >
                {inProject ? <ProjectNav {...props} /> : <ProjectsSection {...props} />}
            </motion.div>
        </AnimatePresence>
    );
}
