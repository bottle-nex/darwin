"use client";
import { useMemo } from "react";
import { issueMatchesFilters } from "@/lib/kanban/boardFilter";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";

/**
 * A predicate keyed by issue id, so both boards can filter their own mirrors
 * without those mirrors having to carry the full issue. The mirrors own where a
 * card sits (including local drag-and-drop moves the server hasn't seen); the
 * query owns its attributes, which is what the facets match on.
 */
export function useIssueFilter({ skipStatus = false }: { skipStatus?: boolean } = {}) {
    const activeProject = useActiveProject();
    const { data: serverBoard } = useBoard(activeProject?.id);
    const filters = useKanbanFilterStore((s) => s.filters);

    return useMemo(() => {
        const byId = new Map((serverBoard?.issues ?? []).map((issue) => [issue.id, issue]));
        return (issueId: string) => {
            const issue = byId.get(issueId);
            return issue ? issueMatchesFilters(issue, filters, { skipStatus }) : true;
        };
    }, [serverBoard, filters, skipStatus]);
}
