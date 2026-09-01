"use client";
import { laneSelectorsFor, useBoardFeed } from "@/hooks/issues/useBoard";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useIssueView } from "@/hooks/issues/useIssueView";
import { useActiveProject } from "@/hooks/useActiveProject";
import { COLUMN_GROUPING, NO_GROUPING } from "@/lib/kanban/issueGrouping";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import type { BoardScope } from "@/types/board";

import BoardLanePagination from "./BoardLanePagination";
import GroupedIssueBoard from "./GroupedIssueBoard";
import GroupedIssueList from "./GroupedIssueList";

/**
 * A board pane, in whichever layout it is set to. Both layouts read the same
 * filtered pool and the same grouping — only the shape on screen differs.
 */
export default function KanbanContent({ scope }: { scope: BoardScope }) {
    const projectId = useActiveProject()?.id;
    const feed = useBoardFeed(projectId);
    const { data: metadata } = useBoardColumns(projectId);
    const { layout, groupBy } = useIssueView(scope);
    const focus = useKanbanOptionsStore((state) => state.focus);
    const focusGroupKey =
        focus.kind === "llm" ? focus.status : focus.kind === "custom" ? focus.columnId : null;
    // Grouped its own way, every column is a server lane and pages by itself.
    const byOwnLanes =
        scope.kind === "agent" ? groupBy === "statuses" : groupBy === COLUMN_GROUPING;

    const statusLabel = feed.fallbackPending
        ? "Searching all board issues"
        : feed.basePending
          ? "Loading board issues"
          : feed.baseError || feed.fallbackError
            ? "Board issues could not be loaded. Retry is available."
            : feed.rows.length === 0
              ? "No board issues"
              : `${feed.rows.length} loaded board issues`;

    // Lanes page one at a time on the server. Their loaders sit under the pane so
    // the pool keeps filling however the issues are grouped on screen.
    const laneLoaders = laneSelectorsFor(scope, metadata?.columns).map((selector) => (
        <BoardLanePagination
            key={
                selector.type === "system"
                    ? `system:${selector.status}`
                    : `custom:${selector.columnId}`
            }
            selector={selector}
        />
    ));

    if (layout === "list") {
        return (
            <GroupedIssueList
                issues={feed.rows}
                groupBy={groupBy}
                selectionScope="kanban"
                status={{ label: statusLabel }}
                footer={laneLoaders}
            />
        );
    }

    return (
        <GroupedIssueBoard
            issues={feed.rows}
            groupBy={groupBy === NO_GROUPING ? "statuses" : groupBy}
            selectionScope="kanban"
            scope={scope}
            focusGroupKey={focusGroupKey}
            lanePaged={byOwnLanes}
            footer={byOwnLanes ? undefined : laneLoaders}
        />
    );
}
