"use client";

import { useEffect } from "react";

import SelectionBar, {
    SelectionBarButton,
} from "@/components/playground/Core/components/SelectionBar";
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

    useIssueSelectionShortcuts();

    useEffect(() => {
        clear();
    }, [tab, projectId, clear]);

    return (
        <SelectionBar count={ids.length} hint="· press X to add" onClear={clear}>
            <SelectionBarButton onClick={openCommandMenu}>
                <kbd className="rounded pt-0.5 text-[18px] leading-none">⌘</kbd>
                Actions
            </SelectionBarButton>
        </SelectionBar>
    );
}
