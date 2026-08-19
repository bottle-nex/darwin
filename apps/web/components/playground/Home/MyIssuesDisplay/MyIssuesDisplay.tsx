"use client";

import { useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useKanbanFilterUrlSync } from "@/hooks/kanban/useKanbanFilterUrlSync";
import { hasActiveFilters, issueMatchesFilters } from "@/lib/kanban/boardFilter";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import { useMyIssuesOptionsStore } from "@/store/issues/useMyIssuesOptionsStore";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import MyIssuesList from "./MyIssuesList";
import MyIssuesOptionsBar from "./MyIssuesOptionsBar";
import MyIssuesViewBar from "./MyIssuesViewBar";
import { isIssueRelevant } from "./myIssues";

export default function MyIssuesDisplay() {
    const project = useActiveProject();
    const userId = useUserSessionStore((state) => state.session?.user?.id);
    const { data: board, isPending, isError } = useBoard(project?.id);
    const filters = useKanbanFilterStore((state) => state.filters);
    const clearAll = useKanbanFilterStore((state) => state.clearAll);
    const view = useMyIssuesOptionsStore((state) => state.view);
    const groupBy = useMyIssuesOptionsStore((state) => state.groupBy);
    const orderBy = useMyIssuesOptionsStore((state) => state.orderBy);
    const setView = useMyIssuesOptionsStore((state) => state.setView);

    useKanbanFilterUrlSync(project?.id);

    const relevantIssues = useMemo(() => {
        if (!userId) return [];
        return (board?.issues ?? []).filter((issue) => isIssueRelevant(issue, userId, view));
    }, [board?.issues, userId, view]);

    const visibleIssues = useMemo(
        () => relevantIssues.filter((issue) => issueMatchesFilters(issue, filters)),
        [relevantIssues, filters],
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <MyIssuesOptionsBar count={visibleIssues.length} />
            <MyIssuesViewBar view={view} onViewChange={setView} />
            <MyIssuesList
                issues={visibleIssues}
                relevantIssueCount={relevantIssues.length}
                projectName={project?.name ?? "ISS"}
                view={view}
                groupBy={groupBy}
                orderBy={orderBy}
                loading={isPending || !userId}
                error={isError}
                filtersActive={hasActiveFilters(filters)}
                onClearFilters={clearAll}
            />
        </div>
    );
}
