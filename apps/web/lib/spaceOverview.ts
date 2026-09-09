import type { BoardColumn, BoardMetadata } from "@/types/board";

export type SpaceColumnProgress = {
    id: string;
    label: string;
    total: number;
    done: number;
};

export type SpaceProgress = {
    columns: SpaceColumnProgress[];
    scope: number;
    completed: number;
    percent: number;
};

export function spaceProgressFor(
    spaceId: string,
    columns: BoardColumn[],
    totals: BoardMetadata["totals"] | undefined,
): SpaceProgress {
    const spaceColumns = columns
        .filter((column) => column.spaceId === spaceId)
        .map((column) => ({
            id: column.id,
            label: column.label,
            total: totals?.custom[column.id] ?? 0,
            done: totals?.done[column.id] ?? 0,
        }));
    const scope = spaceColumns.reduce((sum, column) => sum + column.total, 0);
    const completed = spaceColumns.reduce((sum, column) => sum + column.done, 0);

    return {
        columns: spaceColumns,
        scope,
        completed,
        percent: scope === 0 ? 0 : Math.round((completed / scope) * 100),
    };
}
