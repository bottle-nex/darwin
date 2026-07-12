"use client";
import { AnimatePresence, motion } from "motion/react";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import { RailSurface } from "../../IconRail/railSurface";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { HomeTab } from "../homeTabs";
import PrimaryNavSection from "./PrimaryNavSection";
import HomeSettingsNav from "./HomeSettingsNav";
import TeamsSection from "../../Projects/ProjectsSidebar/TeamsSection";

const SETTINGS_TABS: string[] = [
    HomeTab.SettingsProject,
    HomeTab.SettingsTemplates,
    HomeTab.SettingsEnv,
];

/**
 * Home sidebar. Two faces, chosen by the committed Home tab: the main nav (with
 * its Teams section), or — while a settings tab is active — the settings nav.
 * Deriving the face from the tab keeps it in sync with deep links / refresh.
 * Cross-fades between the two so entering / leaving settings feels continuous.
 */
export default function HomeSidebar(props: SidebarSectionProps) {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Home]);
    const inSettings = SETTINGS_TABS.includes(tab);

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={inSettings ? "settings" : "main"}
                initial={{ opacity: 0, x: inSettings ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: inSettings ? 10 : -10 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            >
                {inSettings ? (
                    <HomeSettingsNav {...props} />
                ) : (
                    <>
                        <PrimaryNavSection {...props} />
                        <TeamsSection {...props} />
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
