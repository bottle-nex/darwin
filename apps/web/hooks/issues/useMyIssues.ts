"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { apiClient } from "@/lib/axios";
import { flattenInfinitePages } from "@/lib/pagination/infinitePages";
import { MY_ISSUES_URL } from "@/routes/api_routes";
import type { MyIssuesView } from "@/store/issues/useMyIssuesOptionsStore";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue, BoardIssuePage } from "@/types/board";
import type { BoardFilters } from "@/types/boardFilter";

import { myIssuesKey, normalizeBoardFilters } from "./boardCache";

const PAGE_LIMIT = 50;

// My Issues is one flat, newest-first list. The server still requires both params
// and folds them into the cursor's scope digest, so they are sent as constants.
const GROUP = "none";
const ORDER = "newest";

export function useMyIssues(
    projectId: string | undefined,
    viewerId: string | undefined,
    view: MyIssuesView,
    filters: BoardFilters,
) {
    const normalized = normalizeBoardFilters(filters);
    const query = useInfiniteQuery({
        queryKey: myIssuesKey(projectId ?? "", view, GROUP, ORDER, normalized),
        enabled: Boolean(projectId && viewerId),
        meta: { viewerId },
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const response = await apiClient.get<ApiResponse<BoardIssuePage>>(
                MY_ISSUES_URL(projectId!),
                {
                    params: {
                        view,
                        group: GROUP,
                        order: ORDER,
                        filters: JSON.stringify(normalized),
                        cursor: pageParam ?? undefined,
                        limit: PAGE_LIMIT,
                    },
                    signal,
                },
            );
            return response.data.data;
        },
        getNextPageParam: (page) => page.nextCursor ?? undefined,
    });
    const issues = useMemo<BoardIssue[]>(
        () => (query.data ? flattenInfinitePages(query.data.pages) : []),
        [query.data],
    );

    return {
        ...query,
        issues,
        total: query.data?.pages[0]?.total ?? 0,
    };
}
