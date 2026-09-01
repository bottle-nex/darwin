"use client";

import { useBoardLaneModel } from "@/hooks/issues/useBoard";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { BoardLaneSelector } from "@/types/board";

import IssueBoardColumn, { type IssueBoardColumnProps } from "./IssueBoardColumn";

/**
 * A column whose group is one of the server's own lanes — a status, or a space's
 * column. Those page one at a time as you scroll the column, the way the board
 * has always loaded.
 */
export default function BoardLaneColumn({
    lane,
    ...props
}: IssueBoardColumnProps & { lane: BoardLaneSelector }) {
    const projectId = useActiveProject()?.id;
    const model = useBoardLaneModel(projectId, lane);
    const searching = model.source === "fallback";

    return (
        <IssueBoardColumn
            {...props}
            knownTotal={model.source === "base" ? model.serverTotal : undefined}
            autoFill={{
                key: `${props.group.key}:${model.source}`,
                hasNextPage: Boolean(searching ? model.hasNextFallbackPage : model.hasNextBasePage),
                fetchingNextPage: searching
                    ? model.isFetchingNextFallbackPage
                    : model.isFetchingNextBasePage,
                pageError: searching ? model.fallbackError : model.laneError || model.basePageError,
                paused: false,
                onLoadMore: () =>
                    searching ? model.fetchNextFallbackPage() : model.fetchNextBasePage(),
            }}
        />
    );
}
