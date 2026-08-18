"use client";
import { AnimatePresence, motion } from "motion/react";
import { HiOutlineArrowUpCircle, HiOutlineUserPlus } from "react-icons/hi2";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import PlaygroundLeadBar from "@/components/playground/Core/TopBar/PlaygroundLeadBar";
import PlaygroundUserMenu from "@/components/playground/Core/TopBar/PlaygroundUserMenu";
import { PlaygroundTab } from "../playgroundTabs";
import SidebarRow from "./SidebarRow";
import BoardSection from "./BoardSection";
import ForYouSection from "./ForYouSection";
import TeamsSection from "./TeamsSection";
import SettingsNavSection from "./SettingsNavSection";

const SETTINGS_TABS: string[] = [
    PlaygroundTab.SettingsProject,
    PlaygroundTab.SettingsTemplates,
    PlaygroundTab.SettingsEnv,
];

export default function SidebarContent() {
    const selectedRowId = usePlaygroundNavStore((s) => s.tab);
    const setTab = usePlaygroundNavStore((s) => s.setTab);

    const inSettings = SETTINGS_TABS.includes(selectedRowId);
    const section = {
        selectedRowId,
        onSelect: (id: string) => setTab(id),
    };

    return (
        <div className="flex h-full min-h-0 flex-col pr-2">
            <div
                className="flex shrink-0 items-center px-1"
                style={{ height: PANE_TOP_BAR_HEIGHT }}
            >
                <PlaygroundLeadBar />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-1">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={inSettings ? "settings" : "main"}
                        initial={{ opacity: 0, x: inSettings ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: inSettings ? 10 : -10 }}
                        transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                        className="flex flex-col gap-3"
                    >
                        {inSettings ? (
                            <SettingsNavSection {...section} />
                        ) : (
                            <>
                                <BoardSection {...section} />
                                <ForYouSection {...section} />
                                <TeamsSection />
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex flex-col gap-0.5 px-1 pb-1">
                <SidebarRow label="Invite" leading={{ kind: "icon", icon: HiOutlineUserPlus }} />
                <SidebarRow label="Pro" leading={{ kind: "icon", icon: HiOutlineArrowUpCircle }} />
                <PlaygroundUserMenu />
            </div>
        </div>
    );
}
