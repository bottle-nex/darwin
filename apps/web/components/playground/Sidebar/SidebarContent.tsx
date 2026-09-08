"use client";
import { SwipeTarget } from "@trydarwin/types";
import { AddIcon } from "@trydarwin/ui/icons";
import { motion } from "motion/react";
import { useRef, useState } from "react";

import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import PlaygroundLeadBar from "@/components/playground/Core/TopBar/PlaygroundLeadBar";
import PlaygroundUserMenu from "@/components/playground/Core/TopBar/PlaygroundUserMenu";
import { useDarwinThreads } from "@/hooks/darwin/useDarwinThreads";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { cn } from "@/lib/utils";
import { useDarwinThreadStore } from "@/store/playground/useDarwinThreadStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import { PlaygroundTab } from "../playgroundTabs";
import BoardSection from "./BoardSection";
import DarwinPanel from "./DarwinPanel";
import { filterDarwinThreads } from "./darwinThreads";
import ForYouSection from "./ForYouSection";
import { filterSettingsItems } from "./settingsItems";
import SettingsPanel from "./SettingsPanel";
import SidebarActions from "./SidebarActions";
import { paneForTab, type SidebarPane } from "./sidebarPanes";
import SidebarSearchRow from "./SidebarSearchRow";
import TeamsSection from "./TeamsSection";

const PANEL_TRANSITION = { duration: 0.26, ease: [0.32, 0.72, 0, 1] } as const;
const PANEL_SLIDE = 28;
const SWIPE_TRIGGER_DISTANCE = 50;
const SWIPE_SETTLE_MS = 200;
const SWIPE_COMMIT_MS = 300;

const PANE = "absolute inset-0 flex flex-col gap-3 overflow-x-hidden overflow-y-auto px-2";

/** The tab each pane lands on when the sidebar swipes into it. */
const PANE_ENTRY_TAB: Record<Exclude<SidebarPane, "workspace">, PlaygroundTab> = {
    settings: PlaygroundTab.SettingsOverview,
    darwin: PlaygroundTab.AskDarwin,
};

const SWIPE_PANE: Record<SwipeTarget, Exclude<SidebarPane, "workspace"> | null> = {
    [SwipeTarget.Settings]: "settings",
    [SwipeTarget.Darwin]: "darwin",
    [SwipeTarget.Off]: null,
};

/**
 * True when the wheel event started inside something that scrolls sideways itself.
 *
 * Without this a wide table or a horizontal carousel in the sidebar steals the gesture: its own
 * scroll and the pane swipe both fire from the same event.
 */
function inside_horizontal_scroller(target: EventTarget | null): boolean {
    let node = target instanceof Element ? target : null;
    while (node) {
        if (node.scrollWidth > node.clientWidth + 1) {
            const overflow = getComputedStyle(node).overflowX;
            if (overflow === "auto" || overflow === "scroll") return true;
        }
        node = node.parentElement;
    }
    return false;
}

export default function SidebarContent() {
    const selectedRowId = usePlaygroundNavStore((s) => s.tab);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const returnToWorkspace = usePlaygroundNavStore((s) => s.returnToWorkspace);
    const activeProject = useActiveProject();
    const { swipeTarget } = useUserConfig();
    const threads = useDarwinThreads(activeProject?.id);
    const openThread = useDarwinThreadStore((state) => state.open);
    const startNewChat = useDarwinThreadStore((state) => state.reset);
    const [paneQuery, setPaneQuery] = useState("");

    // Set only while a swipe is mid-flight, so the panes cross-fade immediately and the tab
    // catches up once the gesture commits.
    const [paneOverride, setPaneOverride] = useState<SidebarPane | null>(null);
    const pane = paneOverride ?? paneForTab(selectedRowId);
    const section = {
        selectedRowId,
        onSelect: (id: string) => setTab(id),
    };

    function selectTopMatch() {
        if (pane === "darwin") {
            const { topMatch } = filterDarwinThreads(threads.data ?? [], paneQuery);
            if (!topMatch) return;
            openThread(topMatch.id);
            setPaneQuery("");
            return;
        }
        const { topMatch } = filterSettingsItems(paneQuery, Boolean(activeProject));
        if (!topMatch) return;
        setTab(topMatch.tab);
        setPaneQuery("");
    }

    function goToWorkspace() {
        setPaneQuery("");
        returnToWorkspace();
    }

    const swipe = useRef({
        distance: 0,
        fired: false,
        firedDirection: 0,
        settleTimer: 0,
        commitTimer: 0,
    });

    function swipeTo(next: SidebarPane) {
        const gesture = swipe.current;
        setPaneOverride(next);
        window.clearTimeout(gesture.commitTimer);
        gesture.commitTimer = window.setTimeout(() => {
            if (next === "workspace") goToWorkspace();
            else setTab(PANE_ENTRY_TAB[next]);
            setPaneOverride(null);
        }, SWIPE_COMMIT_MS);
    }

    function handlePaneSwipe(event: React.WheelEvent) {
        const target = SWIPE_PANE[swipeTarget];
        if (!target) return;
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
        if (inside_horizontal_scroller(event.target)) return;

        const gesture = swipe.current;
        window.clearTimeout(gesture.settleTimer);
        gesture.settleTimer = window.setTimeout(() => {
            gesture.distance = 0;
            gesture.fired = false;
        }, SWIPE_SETTLE_MS);

        const direction = Math.sign(event.deltaX);
        if (gesture.fired) {
            if (direction === 0 || direction === gesture.firedDirection) return;
            gesture.fired = false;
            gesture.distance = 0;
        }
        gesture.distance += event.deltaX;

        if (gesture.distance > SWIPE_TRIGGER_DISTANCE && pane === "workspace") {
            gesture.fired = true;
            gesture.firedDirection = 1;
            swipeTo(target);
        } else if (gesture.distance < -SWIPE_TRIGGER_DISTANCE && pane !== "workspace") {
            gesture.fired = true;
            gesture.firedDirection = -1;
            swipeTo("workspace");
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div
                className="flex shrink-0 items-center justify-between gap-1 px-2"
                style={{ height: PANE_TOP_BAR_HEIGHT }}
            >
                {pane !== "workspace" ? (
                    <SidebarSearchRow
                        label={pane === "settings" ? "settings" : "chats"}
                        value={paneQuery}
                        onChange={setPaneQuery}
                        onBack={goToWorkspace}
                        onSubmit={selectTopMatch}
                        action={
                            pane === "darwin"
                                ? { icon: AddIcon, label: "New chat", onClick: startNewChat }
                                : undefined
                        }
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

            <div className="relative min-h-0 flex-1" onWheel={handlePaneSwipe}>
                <Pane visible={pane === "workspace"} from="left">
                    <ForYouSection {...section} />
                    <BoardSection {...section} />
                    <TeamsSection />
                </Pane>

                <Pane visible={pane === "settings"} from="right">
                    <SettingsPanel {...section} query={paneQuery} />
                </Pane>

                <Pane visible={pane === "darwin"} from="right">
                    <DarwinPanel query={paneQuery} />
                </Pane>
            </div>

            <div className="px-2 pb-2">
                <PlaygroundUserMenu />
            </div>
        </div>
    );
}

/** One face of the sidebar. Hidden faces stay mounted so their scroll position survives. */
function Pane({
    visible,
    from,
    children,
}: {
    visible: boolean;
    from: "left" | "right";
    children: React.ReactNode;
}) {
    const offset = from === "left" ? -PANEL_SLIDE : PANEL_SLIDE;
    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : offset }}
            transition={PANEL_TRANSITION}
            aria-hidden={!visible}
            className={cn(PANE, !visible && "pointer-events-none opacity-0")}
        >
            {children}
        </motion.div>
    );
}
