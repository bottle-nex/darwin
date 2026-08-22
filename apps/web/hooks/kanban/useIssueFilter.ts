"use client";

import { useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoardFeed } from "@/hooks/issues/useBoard";
import { issueMatchesFilters } from "@/lib/kanban/boardFilter";

export function useIssueFilter({ skipStatus = false }: { skipStatus?: boolean } = {}) {
    const projectId = useActiveProject()?.id;
    const feed = useBoardFeed(projectId);

    return useMemo(() => {
        const byId = new Map(feed.rows.map((issue) => [issue.id, issue]));
        return (issueId: string) => {
            const issue = byId.get(issueId);
            return issue ? issueMatchesFilters(issue, feed.filters, { skipStatus }) : true;
        };
    }, [feed.rows, feed.filters, skipStatus]);
}
