"use client";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { useGetProjectConfig } from "@/hooks/project/useGetProjectConfig";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { BoardScope } from "@/types/board";

import KanbanOptionsBarFlatKeys from "./KanbanOptionsBarFlatKeys";
import KanbanOptionsBarGroupedKeys from "./KanbanOptionsBarGroupedKeys";

function KanbanOptionsBarSkeleton() {
    return (
        <>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>
            <PaneActionsSlot>
                <div className="flex items-center gap-1.5">
                    <div className="h-5 w-16 animate-pulse rounded-md bg-overlay/5" />
                    <div className="h-5 w-20 animate-pulse rounded-md bg-overlay/5" />
                    <div className="h-5 w-24 animate-pulse rounded-md bg-overlay/5" />
                    <div className="h-5 w-16 animate-pulse rounded-sm bg-overlay/5" />
                </div>
            </PaneActionsSlot>
        </>
    );
}

export default function KanbanOptionsBar({ scope }: { scope: BoardScope }) {
    const projectId = useActiveProject()?.id;
    const { data: projectConfig, isLoading } = useGetProjectConfig(projectId);

    if (isLoading) return <KanbanOptionsBarSkeleton />;
    switch (projectConfig?.kanbanOptionView) {
        case "GROUPED":
            return <KanbanOptionsBarGroupedKeys scope={scope} />;
        default:
            return <KanbanOptionsBarFlatKeys scope={scope} />;
    }
}
