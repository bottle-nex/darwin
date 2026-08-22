"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { flattenInfinitePages } from "@/lib/pagination/infinitePages";
import { apiClient } from "@/lib/axios";
import { myIssuesKey, normalizeBoardFilters } from "./boardCache";
import { MY_ISSUES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardFilters } from "@/types/boardFilter";
import type { BoardIssue, BoardIssuePage } from "@/types/board";
import type {
    MyIssuesGroup,
    MyIssuesOrder,
    MyIssuesView,
} from "@/store/issues/useMyIssuesOptionsStore";

const PAGE_LIMIT = 50;

export function useMyIssues(
    projectId: string | undefined,
    viewerId: string | undefined,
    view: MyIssuesView,
    group: MyIssuesGroup,
    order: MyIssuesOrder,
    filters: BoardFilters,
) {
    const normalized = normalizeBoardFilters(filters);
    const query = useInfiniteQuery({
        queryKey: myIssuesKey(projectId ?? "", view, group, order, normalized),
        enabled: Boolean(projectId && viewerId),
        meta: { viewerId },
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam, signal }) => {
            const response = await apiClient.get<ApiResponse<BoardIssuePage>>(
                MY_ISSUES_URL(projectId!),
                {
                    params: {
                        view,
                        group,
                        order,
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
