"use client";
import { AnimatePresence, motion } from "motion/react";
import { HiOutlineArrowUpCircle, HiOutlineUserPlus } from "react-icons/hi2";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { HomeTab } from "../Home/homeTabs";
import { Surface } from "./surface";
import SidebarRow from "./SidebarRow";
import PrimaryNavSection from "./PrimaryNavSection";
import SettingsNavSection from "./SettingsNavSection";
import TeamsSection from "./TeamsSection";

const SETTINGS_TABS: string[] = [
    HomeTab.SettingsProject,
    HomeTab.SettingsTemplates,
    HomeTab.SettingsEnv,
];

/**
 * The workspace's left nav column, sitting on the page background beside the
 * main pane's card.
 *
 * It has two faces, chosen by the committed tab: the main nav (with its Teams
 * section), or — while a settings tab is active — the settings nav. Deriving
 * the face from the tab keeps it in sync with deep links / refresh, and the
 * cross-fade makes entering / leaving settings feel continuous.
 */
export default function PlaygroundSidebar() {
    const selectedRowId = usePlaygroundNavStore((s) => s.tabBySurface[Surface.Home]);
    const setTab = usePlaygroundNavStore((s) => s.setTab);

    const inSettings = SETTINGS_TABS.includes(selectedRowId);
    const section = {
        selectedRowId,
        onSelect: (id: string) => setTab(Surface.Home, id),
    };

    return (
        <aside
            data-lenis-prevent
            aria-label="Sidebar"
            className="flex h-full min-h-0 w-60 shrink-0 flex-col justify-between"
        >
            <div className="min-h-0 flex-1 overflow-y-auto px-1 pt-1">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={inSettings ? "settings" : "main"}
                        initial={{ opacity: 0, x: inSettings ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: inSettings ? 10 : -10 }}
                        transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {inSettings ? (
                            <SettingsNavSection {...section} />
                        ) : (
                            <>
                                <PrimaryNavSection {...section} />
                                <TeamsSection />
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex flex-col gap-0.5 px-1 pb-1">
                <SidebarRow label="Invite" leading={{ kind: "icon", icon: HiOutlineUserPlus }} />
                <SidebarRow label="Pro" leading={{ kind: "icon", icon: HiOutlineArrowUpCircle }} />
            </div>
        </aside>
    );
}
