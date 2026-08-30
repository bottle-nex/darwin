"use client";
import { motion } from "motion/react";
import { useState } from "react";

import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import PlaygroundLeadBar from "@/components/playground/Core/TopBar/PlaygroundLeadBar";
import PlaygroundUserMenu from "@/components/playground/Core/TopBar/PlaygroundUserMenu";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import { isSettingsTab } from "../playgroundTabs";
import BoardSection from "./BoardSection";
import ForYouSection from "./ForYouSection";
import { filterSettingsItems } from "./settingsItems";
import SettingsPanel from "./SettingsPanel";
import SettingsSearchRow from "./SettingsSearchRow";
import SidebarActions from "./SidebarActions";
import TeamsSection from "./TeamsSection";

const PANEL_TRANSITION = { duration: 0.26, ease: [0.32, 0.72, 0, 1] } as const;
const PANEL_SLIDE = 28;

const PANE = "absolute inset-0 flex flex-col gap-3 overflow-x-hidden overflow-y-auto px-2";

export default function SidebarContent() {
    const selectedRowId = usePlaygroundNavStore((s) => s.tab);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const returnFromSettings = usePlaygroundNavStore((s) => s.returnFromSettings);
    const activeProject = useActiveProject();
    const [settingsQuery, setSettingsQuery] = useState("");

    const inSettings = isSettingsTab(selectedRowId);
    const section = {
        selectedRowId,
        onSelect: (id: string) => setTab(id),
    };

    function selectTopMatch() {
        const { topMatch } = filterSettingsItems(settingsQuery, Boolean(activeProject));
        if (!topMatch) return;
        setTab(topMatch.tab);
        setSettingsQuery("");
    }

    function leaveSettings() {
        setSettingsQuery("");
        returnFromSettings();
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div
                className="flex shrink-0 items-center justify-between gap-1 px-2"
                style={{ height: PANE_TOP_BAR_HEIGHT }}
            >
                {inSettings ? (
                    <SettingsSearchRow
                        value={settingsQuery}
                        onChange={setSettingsQuery}
                        onBack={leaveSettings}
                        onSubmit={selectTopMatch}
                    />
                ) : (
                    <>
                        <div className="min-w-0 flex-1">
                            <PlaygroundLeadBar />
                        </div>
                        <SidebarActions />
                    </>
                )}
            </div>

            <div className="relative min-h-0 flex-1">
                <motion.div
                    initial={false}
                    animate={{ opacity: inSettings ? 0 : 1, x: inSettings ? -PANEL_SLIDE : 0 }}
                    transition={PANEL_TRANSITION}
                    aria-hidden={inSettings}
                    className={cn(PANE, inSettings && "pointer-events-none opacity-0")}
                >
                    <ForYouSection {...section} />
                    <BoardSection {...section} />
                    <TeamsSection />
                </motion.div>

                <motion.div
                    initial={false}
                    animate={{ opacity: inSettings ? 1 : 0, x: inSettings ? 0 : PANEL_SLIDE }}
                    transition={PANEL_TRANSITION}
                    aria-hidden={!inSettings}
                    className={cn(PANE, !inSettings && "pointer-events-none opacity-0")}
                >
                    <SettingsPanel {...section} query={settingsQuery} />
                </motion.div>
            </div>

            <div className="px-2 pb-2">
                <PlaygroundUserMenu />
            </div>
        </div>
    );
}
