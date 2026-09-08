"use client";
import { useQuery } from "@tanstack/react-query";
import type { DarwinThreadSummary } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { DARWIN_THREADS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export function darwinThreadsKey(projectId: string) {
    return ["darwin-threads", projectId] as const;
}

/**
 * The caller's own Darwin conversations in this project, newest first.
 *
 * Threads are private to the person who opened them, so this never shows a teammate's questions.
 *
 * @example
 * const threads = useDarwinThreads(projectId);
 * threads.data?.[0]?.title; // "what's blocking the release?"
 */
export function useDarwinThreads(projectId: string | undefined) {
    return useQuery({
        queryKey: darwinThreadsKey(projectId ?? ""),
        enabled: Boolean(projectId),
        queryFn: async ({ signal }) => {
            const res = await apiClient.get<ApiResponse<DarwinThreadSummary[]>>(
                DARWIN_THREADS_URL(projectId!),
                { signal },
            );
            return res.data.data;
        },
    });
}
