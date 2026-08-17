"use client";
import { AnimatePresence, motion } from "motion/react";
import { HiOutlineArrowUpCircle, HiOutlineCog6Tooth, HiOutlineUserPlus } from "react-icons/hi2";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
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
        <div className="flex h-full min-h-0 flex-col justify-between pr-2">
            <div className="min-h-0 flex-1 overflow-y-auto px-1 pt-1">
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
                <SidebarRow
                    label="Settings"
                    leading={{ kind: "icon", icon: HiOutlineCog6Tooth }}
                    active={inSettings}
                    onClick={() => section.onSelect(PlaygroundTab.SettingsProject)}
                />
                <SidebarRow label="Invite" leading={{ kind: "icon", icon: HiOutlineUserPlus }} />
                <SidebarRow label="Pro" leading={{ kind: "icon", icon: HiOutlineArrowUpCircle }} />
            </div>
        </div>
    );
}
