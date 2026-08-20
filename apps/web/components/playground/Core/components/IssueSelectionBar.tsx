"use client";

import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import { Button } from "@/components/ui/button";
import KeyCombo from "@/components/ui/KeyCombo";
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

    useIssueSelectionShortcuts();

    useEffect(() => {
        clear();
    }, [tab, projectId, clear]);

    if (!ids.length) return null;

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-edge bg-cement/95 py-1.5 pr-1.5 pl-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur">
                <span className="text-[13px] text-neutral-300">{ids.length} selected</span>
                <span className="hidden text-[12px] text-neutral-500 sm:inline">
                    · click or press X to add
                </span>
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={openCommandMenu}
                    className="ml-2 flex cursor-pointer items-center gap-2 rounded-full bg-snow/6 px-3 py-1.5 text-[13px] text-neutral-100 transition-colors hover:bg-snow/10"
                >
                    <KeyCombo keys={["⌘", "K"]} />
                    Actions
                </Button>
                <Button
                    variant="unstyled"
                    type="button"
                    aria-label="Clear selection"
                    onClick={clear}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-snow/8 hover:text-neutral-200"
                >
                    <MdClose className="size-4" aria-hidden />
                </Button>
            </div>
        </div>
    );
}
