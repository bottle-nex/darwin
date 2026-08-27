"use client";

import { CloseIcon } from "@trymatcha/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import IconWrapper from "@/components/ui/IconWrapper";
import { useIssueSelectionShortcuts } from "@/hooks/issues/useIssueSelectionShortcuts";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

export default function IssueSelectionBar() {
    const ids = useIssueSelectionStore((s) => s.ids);
    const clear = useIssueSelectionStore((s) => s.clear);
    const openCommandMenu = useCommandMenuStore((s) => s.open);
    const tab = usePlaygroundNavStore((s) => s.tab);
    const projectId = useActiveProject()?.id;
    const reduceMotion = useReducedMotion();

    useIssueSelectionShortcuts();

    useEffect(() => {
        clear();
    }, [tab, projectId, clear]);

    return (
        <AnimatePresence>
            {ids.length > 0 && (
                <motion.div
                    key="issue-selection-bar"
                    initial={reduceMotion ? false : { y: "calc(100% + 3rem)" }}
                    animate={{ y: 0 }}
                    exit={reduceMotion ? { y: 0 } : { y: "calc(100% + 3rem)" }}
                    transition={{
                        duration: reduceMotion ? 0 : 0.28,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center"
                >
                    <div className="pointer-events-auto flex items-center gap-1 rounded-lg bg-cement py-1.75 pr-2 pl-5 shadow-xl shadow-black/20">
                        <span className="text-[13px] text-snow/90">{ids.length} selected</span>
                        <span className="hidden text-[12px] text-neutral-500 sm:inline">
                            · press X to add
                        </span>
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={openCommandMenu}
                            className="ml-2 flex cursor-pointer items-center gap-1.25 rounded-lg bg-snow/4 py-1.25 pr-3.5 pl-3 text-[11px] text-snow transition-colors hover:bg-snow/6 border border-snow/5 shadow-sm shadow-black/7"
                        >
                            <kbd className="rounded text-[18px] leading-none pt-0.5">⌘</kbd>
                            Actions
                        </Button>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Clear selection"
                            onClick={clear}
                            className="group cursor-pointer rounded-full"
                        >
                            <IconWrapper icon={CloseIcon} variant="ghost" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
