"use client";

import { useIssueView } from "@/hooks/issues/useIssueView";
import { useMyIssues } from "@/hooks/issues/useMyIssues";
import { useKanbanFilterUrlSync } from "@/hooks/kanban/useKanbanFilterUrlSync";
import { useActiveProject } from "@/hooks/useActiveProject";
import { hasActiveFilters } from "@/lib/kanban/boardFilter";
import { useMyIssuesOptionsStore } from "@/store/issues/useMyIssuesOptionsStore";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
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
    const setView = useMyIssuesOptionsStore((state) => state.setView);
    const { layout, groupBy } = useIssueView("my-issues");
    const myIssues = useMyIssues(project?.id, userId ?? undefined, view, filters);

    useKanbanFilterUrlSync(project?.id);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <MyIssuesOptionsBar count={myIssues.total} />
            <MyIssuesViewBar view={view} onViewChange={setView} />
            <MyIssuesList
                issues={myIssues.issues}
                total={myIssues.total}
                view={view}
                layout={layout}
                groupBy={groupBy}
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
