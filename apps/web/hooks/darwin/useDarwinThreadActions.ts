"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DarwinThreadSummary } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { DARWIN_THREAD_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { darwinThreadKey } from "./useDarwinThread";
import { darwinThreadsKey } from "./useDarwinThreads";

/**
 * Rename one conversation.
 *
 * The list is written straight away rather than refetched: the row is under the user's cursor and
 * a round trip would let the old title sit there long enough to look like the rename failed. A
 * failure puts the previous list back.
 *
 * @example
 * const rename = useRenameDarwinThread(projectId);
 * rename.mutate({ threadId, title: "release blockers" });
 */
export function useRenameDarwinThread(projectId: string | undefined) {
    const queryClient = useQueryClient();
    const listKey = darwinThreadsKey(projectId ?? "");

    return useMutation({
        mutationFn: async ({ threadId, title }: { threadId: string; title: string }) => {
            const res = await apiClient.patch<ApiResponse<DarwinThreadSummary>>(
                DARWIN_THREAD_URL(projectId!, threadId),
                { title },
            );
            return res.data.data;
        },
        onMutate: async ({ threadId, title }) => {
            await queryClient.cancelQueries({ queryKey: listKey });
            const previous = queryClient.getQueryData<DarwinThreadSummary[]>(listKey);
            queryClient.setQueryData<DarwinThreadSummary[]>(listKey, (rows) =>
                rows?.map((row) => (row.id === threadId ? { ...row, title } : row)),
            );
            return { previous };
        },
        onError: (_error, _input, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}

/**
 * Delete one conversation and everything it holds.
 *
 * Its cached messages go too, so reopening a thread with a reused id can never show the old one.
 *
 * @example
 * const remove = useDeleteDarwinThread(projectId);
 * remove.mutate(threadId);
 */
export function useDeleteDarwinThread(projectId: string | undefined) {
    const queryClient = useQueryClient();
    const listKey = darwinThreadsKey(projectId ?? "");

    return useMutation({
        mutationFn: async (threadId: string) => {
            await apiClient.delete(DARWIN_THREAD_URL(projectId!, threadId));
            return threadId;
        },
        onMutate: async (threadId) => {
            await queryClient.cancelQueries({ queryKey: listKey });
            const previous = queryClient.getQueryData<DarwinThreadSummary[]>(listKey);
            queryClient.setQueryData<DarwinThreadSummary[]>(listKey, (rows) =>
                rows?.filter((row) => row.id !== threadId),
            );
            return { previous };
        },
        onSuccess: (threadId) => {
            queryClient.removeQueries({ queryKey: darwinThreadKey(threadId) });
        },
        onError: (_error, _input, context) => {
            if (context?.previous) queryClient.setQueryData(listKey, context.previous);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}
