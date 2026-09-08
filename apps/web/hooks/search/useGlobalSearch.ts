"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type GlobalSearchResult, MIN_GLOBAL_SEARCH_QUERY_LENGTH } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { GLOBAL_SEARCH_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export const GLOBAL_SEARCH_QUERY_KEY = ["global-search"] as const;

const GLOBAL_SEARCH_STALE_TIME = 30_000;

export function isSearchableQuery(query: string) {
    return query.length >= MIN_GLOBAL_SEARCH_QUERY_LENGTH;
}

export function useGlobalSearch(projectId: string | null, query: string, enabled: boolean) {
    return useQuery({
        queryKey: [...GLOBAL_SEARCH_QUERY_KEY, projectId, query],
        enabled: enabled && Boolean(projectId) && isSearchableQuery(query),
        staleTime: GLOBAL_SEARCH_STALE_TIME,
        retry: 0,
        placeholderData: keepPreviousData,
        queryFn: async ({ signal }) => {
            const res = await apiClient.get<ApiResponse<GlobalSearchResult>>(
                GLOBAL_SEARCH_URL(projectId!),
                { params: { q: query }, signal },
            );
            return res.data.data;
        },
    });
}
