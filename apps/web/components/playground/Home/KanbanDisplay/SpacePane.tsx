"use client";
import { useMemo } from "react";

import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import KanbanDisplay from "./KanbanDisplay";

export default function SpacePane() {
    const space = usePlaygroundNavStore((s) => s.selectedSpace);
    const scope = useMemo(
        () => ({ kind: "space" as const, spaceId: space?.id ?? "" }),
        [space?.id],
    );

    if (!space) return null;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <KanbanDisplay key={space.id} scope={scope} />
        </div>
    );
}
