"use client";
import { AddIcon } from "@trydarwin/ui/icons";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";

export default function SpacesOptionsBar({
    count,
    canManage,
    onCreate,
}: {
    /** Total number of spaces in the project. */
    count: number;
    canManage: boolean;
    onCreate: () => void;
}) {
    return (
        <>
            <PaneLeadSlot>
                <div className="flex min-w-0 items-center gap-2">
                    <PlaygroundBreadcrumb />
                    <span className="shrink-0 text-[12px] text-neutral-500">{count}</span>
                </div>
            </PaneLeadSlot>

            <PaneActionsSlot>
                {canManage && (
                    <div className="flex shrink-0 items-center gap-1.5">
                        <OptionButton label="New space" icon={AddIcon} onClick={onCreate} />
                    </div>
                )}
            </PaneActionsSlot>
        </>
    );
}
