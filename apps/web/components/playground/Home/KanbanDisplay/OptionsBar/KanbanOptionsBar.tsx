"use client";
import { useGetProjectConfig } from "@/hooks/project/useGetProjectConfig";
import { useActiveProject } from "@/hooks/useActiveProject";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
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
                    <div className="h-5 w-16 animate-pulse rounded-md bg-white/5" />
                    <div className="h-5 w-20 animate-pulse rounded-md bg-white/5" />
                    <div className="h-5 w-24 animate-pulse rounded-md bg-white/5" />
                    <div className="h-5 w-16 animate-pulse rounded-sm bg-white/5" />
                </div>
            </PaneActionsSlot>
        </>
    );
}

export default function KanbanOptionsBar() {
    const projectId = useActiveProject()?.id;
    const { data: projectConfig, isLoading } = useGetProjectConfig(projectId);

    if (isLoading) return <KanbanOptionsBarSkeleton />;
    switch (projectConfig?.kanbanOptionView) {
        case "GROUPED":
            return <KanbanOptionsBarGroupedKeys />;
        default:
            return <KanbanOptionsBarFlatKeys />;
    }
}
