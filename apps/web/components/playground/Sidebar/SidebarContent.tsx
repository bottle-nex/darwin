"use client";
import { AnimatePresence, motion } from "motion/react";

import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import PlaygroundLeadBar from "@/components/playground/Core/TopBar/PlaygroundLeadBar";
import PlaygroundUserMenu from "@/components/playground/Core/TopBar/PlaygroundUserMenu";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import { isSettingsTab } from "../playgroundTabs";
import BoardSection from "./BoardSection";
import ChaptersSection from "./ChaptersSection";
import ForYouSection from "./ForYouSection";
import SettingsPanel from "./SettingsPanel";
import SidebarActions from "./SidebarActions";
import TeamsSection from "./TeamsSection";

export default function SidebarContent() {
    const selectedRowId = usePlaygroundNavStore((s) => s.tab);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const returnFromSettings = usePlaygroundNavStore((s) => s.returnFromSettings);

    const inSettings = isSettingsTab(selectedRowId);
    const section = {
        selectedRowId,
        onSelect: (id: string) => setTab(id),
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div
                className="flex shrink-0 items-center justify-between gap-1 px-2"
                style={{ height: PANE_TOP_BAR_HEIGHT }}
            >
                <div className="min-w-0 flex-1">
                    <PlaygroundLeadBar />
                </div>
                <SidebarActions />
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-2">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={inSettings ? "settings" : "main"}
                        initial={{ opacity: 0, x: inSettings ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: inSettings ? 10 : -10 }}
                        transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                        className="flex flex-col gap-3 will-change-transform"
                    >
                        {inSettings ? (
                            <SettingsPanel {...section} onBack={returnFromSettings} />
                        ) : (
                            <>
                                <ForYouSection {...section} />
                                <BoardSection {...section} />
                                <ChaptersSection />
                                <TeamsSection />
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-2 pb-2">
                <PlaygroundUserMenu />
            </div>
        </div>
    );
}
