"use client";
import { AnimatePresence, motion } from "motion/react";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import { isProjectSettingsTab } from "../projectsTabs";
import ProjectsSection from "./ProjectsSection";
import ProjectSettingsNav from "./ProjectSettingsNav";

/**
 * Projects sidebar. Two modes, keyed off the active tab: the project list, or —
 * once a project is opened — its settings nav. Cross-fades between the two so
 * opening a project / going Back feels continuous.
 */
export default function ProjectsSidebar(props: SidebarSectionProps) {
    const inSettings = isProjectSettingsTab(props.selectedRowId);

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={inSettings ? "settings" : "list"}
                // The list lives on the left, the settings panel on the right —
                // each enters from and exits to its own side. Opening a project
                // slides the list out left + settings in from right; Back reverses it.
                initial={{ opacity: 0, x: inSettings ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: inSettings ? 10 : -10 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            >
                {inSettings ? <ProjectSettingsNav {...props} /> : <ProjectsSection {...props} />}
            </motion.div>
        </AnimatePresence>
    );
}
