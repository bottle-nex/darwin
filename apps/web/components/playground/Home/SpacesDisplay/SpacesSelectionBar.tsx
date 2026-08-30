"use client";
import { useEffect } from "react";

import SelectionBar, {
    SelectionBarButton,
} from "@/components/playground/Core/components/SelectionBar";
import { useSpaceSelectionShortcuts } from "@/hooks/spaces/useSpaceSelectionShortcuts";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useSpaceSelectionStore } from "@/store/space/useSpaceSelectionStore";

export default function SpacesSelectionBar() {
    const ids = useSpaceSelectionStore((s) => s.ids);
    const clear = useSpaceSelectionStore((s) => s.clear);
    const openCommandMenu = useCommandMenuStore((s) => s.open);
    const tab = usePlaygroundNavStore((s) => s.tab);
    const projectId = useActiveProject()?.id;

    useSpaceSelectionShortcuts();

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
