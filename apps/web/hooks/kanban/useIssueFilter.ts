"use client";

import { useMemo } from "react";

import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useActiveProject } from "@/hooks/useActiveProject";
import { issueMatchesFilters } from "@/lib/kanban/boardFilter";

export function useIssueFilter({ skipStatus = false }: { skipStatus?: boolean } = {}) {
    const projectId = useActiveProject()?.id;
    const feed = useBoardFeed(projectId);
    const { data: metadata } = useBoardColumns(projectId);

    return useMemo(() => {
        const byId = new Map(feed.rows.map((issue) => [issue.id, issue]));
        const spaceByColumn = new Map(
            (metadata?.columns ?? []).map((column) => [column.id, column.spaceId]),
        );
        return (issueId: string) => {
            const issue = byId.get(issueId);
            return issue
                ? issueMatchesFilters(issue, feed.filters, {
                      skipStatus,
                      spaceOfColumn: (columnId) => spaceByColumn.get(columnId),
                  })
                : true;
        };
    }, [feed.rows, feed.filters, metadata?.columns, skipStatus]);
}
