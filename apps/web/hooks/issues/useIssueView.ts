"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveProject } from "@/hooks/useActiveProject";
import { apiClient } from "@/lib/axios";
import { COLUMN_GROUPING, type IssueGroupBy, NO_GROUPING } from "@/lib/kanban/issueGrouping";
import { ISSUE_VIEWS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardScope } from "@/types/board";
import { LIST_FACET_KEYS } from "@/types/boardFilter";

export type IssueLayout = "list" | "board";

export type IssueView = { layout: IssueLayout; groupBy: IssueGroupBy };

type SavedView = { viewKey: string; layout: string; groupBy: string };

/** Which pane a saved view belongs to. Spaces carry their id so each board keeps its own. */
export function viewKeyFor(scope: BoardScope | "my-issues"): string {
    if (scope === "my-issues") return "my-issues";
    return scope.kind === "agent" ? "agent" : `space:${scope.spaceId}`;
}

const BOARD_GROUPINGS: IssueGroupBy[] = [
    NO_GROUPING,
    ...LIST_FACET_KEYS.filter((key) => key !== "spaceIds"),
];

const SPACE_GROUPINGS: IssueGroupBy[] = [COLUMN_GROUPING, ...BOARD_GROUPINGS];

const MY_ISSUES_GROUPINGS: IssueGroupBy[] = [NO_GROUPING, ...LIST_FACET_KEYS];

type ViewOptions = {
    groupings: IssueGroupBy[];
    defaultLayout: IssueLayout;
    fallback: IssueGroupBy;
    boardFallback: IssueGroupBy;
};

/** The groupings a pane offers, and the one it falls back to. */
export function viewOptionsFor(scope: BoardScope | "my-issues"): ViewOptions {
    if (scope === "my-issues") {
        return {
            groupings: MY_ISSUES_GROUPINGS,
            defaultLayout: "list",
            fallback: NO_GROUPING,
            boardFallback: "statuses",
        };
    }
    return scope.kind === "agent"
        ? {
              groupings: BOARD_GROUPINGS,
              defaultLayout: "board",
              fallback: "statuses",
              boardFallback: "statuses",
          }
        : {
              groupings: SPACE_GROUPINGS,
              defaultLayout: "board",
              fallback: COLUMN_GROUPING,
              boardFallback: COLUMN_GROUPING,
          };
}

function issueViewsKey(projectId: string) {
    return ["issue-views", projectId] as const;
}

function isKnownGrouping(groupings: IssueGroupBy[], value: string): value is IssueGroupBy {
    return (groupings as string[]).includes(value);
}

/**
 * How one pane lays its issues out. Saved per user on the server, so a board comes
 * back the way it was left; until it loads the pane shows its own default.
 */
export function useIssueView(scope: BoardScope | "my-issues") {
    const projectId = useActiveProject()?.id;
    const queryClient = useQueryClient();
    const viewKey = viewKeyFor(scope);
    const { groupings, defaultLayout, fallback, boardFallback } = viewOptionsFor(scope);

    const query = useQuery({
        queryKey: issueViewsKey(projectId ?? ""),
        enabled: Boolean(projectId),
        queryFn: async ({ signal }) => {
            const response = await apiClient.get<ApiResponse<{ views: SavedView[] }>>(
                ISSUE_VIEWS_URL(projectId!),
                { signal },
            );
            return response.data.data.views;
        },
    });

    const save = useMutation({
        mutationFn: async (view: IssueView) => {
            await apiClient.patch(ISSUE_VIEWS_URL(projectId!), {
                view_key: viewKey,
                layout: view.layout,
                group_by: view.groupBy,
            });
            return view;
        },
        onMutate: async (view) => {
            const key = issueViewsKey(projectId ?? "");
            await queryClient.cancelQueries({ queryKey: key });
            queryClient.setQueryData<SavedView[]>(key, (saved = []) => [
                ...saved.filter((row) => row.viewKey !== viewKey),
                { viewKey, layout: view.layout, groupBy: view.groupBy },
            ]);
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: issueViewsKey(projectId ?? "") });
        },
    });

    const saved = query.data?.find((row) => row.viewKey === viewKey);
    const layout: IssueLayout = saved
        ? saved.layout === "board"
            ? "board"
            : "list"
        : defaultLayout;
    const savedGroupBy =
        saved && isKnownGrouping(groupings, saved.groupBy) ? saved.groupBy : fallback;
    // A board is its grouping, so it never runs ungrouped.
    const groupBy =
        layout === "board" && savedGroupBy === NO_GROUPING ? boardFallback : savedGroupBy;

    return {
        layout,
        groupBy,
        groupings,
        setLayout: (next: IssueLayout) =>
            save.mutate({
                layout: next,
                groupBy: next === "board" && groupBy === NO_GROUPING ? boardFallback : groupBy,
            }),
        setGroupBy: (next: IssueGroupBy) => save.mutate({ layout, groupBy: next }),
    };
}
