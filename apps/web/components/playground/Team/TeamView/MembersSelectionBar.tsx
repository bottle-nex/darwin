"use client";
import { useEffect } from "react";

import SelectionBar, {
    SelectionBarButton,
} from "@/components/playground/Core/components/SelectionBar";
import { useMemberSelectionShortcuts } from "@/hooks/team/useMemberSelectionShortcuts";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { useMemberSelectionStore } from "@/store/team/useMemberSelectionStore";

export default function MembersSelectionBar({ teamId }: { teamId: string }) {
    const ids = useMemberSelectionStore((s) => s.ids);
    const clear = useMemberSelectionStore((s) => s.clear);
    const openCommandMenu = useCommandMenuStore((s) => s.open);

    useMemberSelectionShortcuts();

    // Also clears on the way out, so a selection can't outlive the pane that made it.
    useEffect(() => {
        clear();
        return clear;
    }, [teamId, clear]);

    return (
        <SelectionBar count={ids.length} hint="· press X to add" onClear={clear}>
            <SelectionBarButton onClick={openCommandMenu}>
                <kbd className="rounded pt-0.5 text-[18px] leading-none">⌘</kbd>
                Actions
            </SelectionBarButton>
        </SelectionBar>
    );
}
