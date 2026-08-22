"use client";

import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { useIssueSelectionShortcuts } from "@/hooks/issues/useIssueSelectionShortcuts";

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
                    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-edge bg-cement/95 py-1.5 pr-2 pl-5 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur">
                        <span className="text-[13px] text-snow/90">{ids.length} selected</span>
                        <span className="hidden text-[12px] text-neutral-500 sm:inline">
                            · click or press X to add
                        </span>
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={openCommandMenu}
                            className="ml-2 flex cursor-pointer items-center gap-2 rounded-full bg-snow/4 py-1.25 pr-3.5 pl-3 text-[11px] text-neutral-100 transition-colors hover:bg-snow/6"
                        >
                            {/* not using key component here because of custom details */}
                            <div className="flex items-center gap-1">
                                <kbd className="flex h-4.5 w-4.5 items-center justify-center rounded border border-white/7 text-[14px] leading-none">
                                    ⌘
                                </kbd>
                                <kbd className="flex h-4.5 w-4.5 items-center justify-center rounded border border-white/7 text-[11.5px] leading-none">
                                    K
                                </kbd>
                            </div>
                            Actions
                        </Button>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Clear selection"
                            onClick={clear}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-snow/6 hover:text-neutral-200"
                        >
                            <MdClose className="size-4" aria-hidden />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
