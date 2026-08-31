"use client";

import { useMemo } from "react";

import type { IconPick } from "@/components/ui/IconPicker";
import { useSpaceBoards } from "@/hooks/issues/useBoardColumns";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { BoardColumn } from "@/types/board";

export type BoardDestinationSpace = {
    id: string;
    name: string;
    icon: IconPick | null;
    columns: BoardColumn[];
};

export type BoardDestinations = {
    /** The agent board row. Hidden when the issue is already there. */
    agentBoard: boolean;
    /** Spaces with somewhere left to move to; the current column is removed. */
    spaces: BoardDestinationSpace[];
    isEmpty: boolean;
};

/**
 * Everywhere an issue can move to. Every rule about what to show lives here, so
 * the right-click menu, the ⌘K page, the row chip and the import picker cannot
 * drift apart again.
 *
 * Pass `currentColumnId` to hide where the issue already is — `null` means the
 * agent board. Pass `undefined` to filter nothing, which is what a config picker
 * wants: it has to be able to show and re-select its own current value.
 */
export function useBoardDestinations(
    currentColumnId: string | null | undefined,
): BoardDestinations {
    const projectId = useActiveProject()?.id;
    const spaceBoards = useSpaceBoards(projectId);

    return useMemo(() => {
        const filtering = currentColumnId !== undefined;
        const agentBoard = !filtering || currentColumnId !== null;

        const spaces = spaceBoards
            .map((space) => ({
                id: space.id,
                name: space.name,
                icon: space.icon,
                columns: space.columns.filter(
                    (column) => !filtering || column.id !== currentColumnId,
                ),
            }))
            .filter((space) => space.columns.length > 0);

        return { agentBoard, spaces, isEmpty: !agentBoard && spaces.length === 0 };
    }, [spaceBoards, currentColumnId]);
}
