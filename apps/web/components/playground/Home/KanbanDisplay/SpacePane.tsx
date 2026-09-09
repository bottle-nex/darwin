"use client";
import { useMemo } from "react";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import SpaceOverview from "@/components/playground/space/overview/SpaceOverview";
import SpaceViewTabs from "@/components/playground/space/SpaceViewTabs";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useSpaceViewStore } from "@/store/space/useSpaceViewStore";

import KanbanDisplay from "./KanbanDisplay";

export default function SpacePane() {
    const space = usePlaygroundNavStore((s) => s.selectedSpace);
    const storedSpaceId = useSpaceViewStore((s) => s.spaceId);
    const storedView = useSpaceViewStore((s) => s.view);
    const scope = useMemo(
        () => ({ kind: "space" as const, spaceId: space?.id ?? "" }),
        [space?.id],
    );

    if (!space) return null;

    // A space opens on its overview; the toggle only persists while that space is shown.
    const view = storedSpaceId === space.id ? storedView : "overview";

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <SpaceViewTabs spaceId={space.id} view={view} />
            {view === "overview" ? (
                <>
                    <PaneLeadSlot>
                        <PlaygroundBreadcrumb />
                    </PaneLeadSlot>
                    <SpaceOverview key={space.id} space={space} />
                </>
            ) : (
                <KanbanDisplay key={space.id} scope={scope} />
            )}
        </div>
    );
}
