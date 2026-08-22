"use client";

import { useActiveProject } from "@/hooks/useActiveProject";
import { useMyIssues } from "@/hooks/issues/useMyIssues";
import { useKanbanFilterUrlSync } from "@/hooks/kanban/useKanbanFilterUrlSync";
import { hasActiveFilters } from "@/lib/kanban/boardFilter";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import { useMyIssuesOptionsStore } from "@/store/issues/useMyIssuesOptionsStore";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import MyIssuesList from "./MyIssuesList";
import MyIssuesOptionsBar from "./MyIssuesOptionsBar";
import MyIssuesViewBar from "./MyIssuesViewBar";

export default function MyIssuesDisplay() {
    const project = useActiveProject();
    const userId = useUserSessionStore((state) => state.session?.user?.id);
    const filters = useKanbanFilterStore((state) => state.filters);
    const clearAll = useKanbanFilterStore((state) => state.clearAll);
    const view = useMyIssuesOptionsStore((state) => state.view);
    const groupBy = useMyIssuesOptionsStore((state) => state.groupBy);
    const orderBy = useMyIssuesOptionsStore((state) => state.orderBy);
    const setView = useMyIssuesOptionsStore((state) => state.setView);
    const myIssues = useMyIssues(project?.id, userId ?? undefined, view, groupBy, orderBy, filters);

    useKanbanFilterUrlSync(project?.id);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <MyIssuesOptionsBar count={myIssues.total} />
            <MyIssuesViewBar view={view} onViewChange={setView} />
            <MyIssuesList
                issues={myIssues.issues}
                total={myIssues.total}
                view={view}
                groupBy={groupBy}
                orderBy={orderBy}
                loading={myIssues.isPending || !userId}
                error={myIssues.isError}
                pageError={myIssues.isFetchNextPageError}
                filtersActive={hasActiveFilters(filters)}
                onClearFilters={clearAll}
                onRetry={() => void myIssues.refetch()}
                hasNextPage={myIssues.hasNextPage}
                fetchingNextPage={myIssues.isFetchingNextPage}
                onLoadMore={() => myIssues.fetchNextPage()}
            />
        </div>
    );
}
