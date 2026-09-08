"use client";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    type DarwinRunOutcome,
    type DarwinStreamEvent,
    type DarwinThreadDetail,
    InboundSocketMessageType,
} from "@trydarwin/types";
import { useEffect } from "react";

import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { apiClient } from "@/lib/axios";
import { DARWIN_THREAD_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { applyDarwinEvents, type DarwinThreadView, sealDarwinRun } from "./darwinCache";

export const DARWIN_THREAD_QUERY_KEY = ["darwin-thread"] as const;

export function darwinThreadKey(threadId: string) {
    return [...DARWIN_THREAD_QUERY_KEY, threadId] as const;
}

/**
 * One Darwin conversation, kept live over the socket.
 *
 * Resubscribes with `live.cursor` rather than from zero, so a tab reloaded mid-answer replays only
 * the tokens it missed. Subscribing is gated on the socket actually being connected — the client
 * queues messages while reconnecting, but the server would have nothing to send to a socket it has
 * not yet accepted.
 *
 * @example
 * const thread = useDarwinThread(projectId, threadId, isConnected);
 * thread.data?.live?.text; // the answer as it types
 */
export function useDarwinThread(
    projectId: string | undefined,
    threadId: string | undefined,
    isSocketConnected: boolean,
) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: darwinThreadKey(threadId ?? ""),
        enabled: Boolean(projectId && threadId),
        queryFn: async ({ signal }) => {
            const res = await apiClient.get<ApiResponse<DarwinThreadDetail>>(
                DARWIN_THREAD_URL(projectId!, threadId!),
                { signal },
            );
            const existing = queryClient.getQueryData<DarwinThreadView>(darwinThreadKey(threadId!));
            return { ...res.data.data, live: existing?.live ?? null } satisfies DarwinThreadView;
        },
    });

    const runId = query.data?.activeRunId;
    const cursor = query.data?.live?.cursor;

    useEffect(() => {
        if (!runId || !isSocketConnected) return;

        send_socket_message({
            type: InboundSocketMessageType.DARWIN_RUN_SUBSCRIBE,
            payload: { runId, cursor },
        });

        return () => {
            send_socket_message({
                type: InboundSocketMessageType.DARWIN_RUN_UNSUBSCRIBE,
                payload: { runId },
            });
        };
    }, [runId, cursor, isSocketConnected]);

    return query;
}

export function append_darwin_events(
    queryClient: QueryClient,
    runId: string,
    events: DarwinStreamEvent[],
    cursor: number,
) {
    for (const [key, view] of darwin_threads(queryClient)) {
        if (view.activeRunId !== runId && view.live?.runId !== runId) continue;
        queryClient.setQueryData<DarwinThreadView>(
            key,
            applyDarwinEvents(view, runId, events, cursor),
        );
    }
}

export function seal_darwin_run(queryClient: QueryClient, runId: string, status: DarwinRunOutcome) {
    for (const [key, view] of darwin_threads(queryClient)) {
        if (view.activeRunId !== runId && view.live?.runId !== runId) continue;
        queryClient.setQueryData<DarwinThreadView>(key, sealDarwinRun(view, runId, status));
    }
}

/**
 * Socket frames carry a run id, not a thread id, so the cached threads are scanned for the one
 * that owns the run. There is at most a handful of threads in cache and one active run.
 */
function darwin_threads(queryClient: QueryClient): [readonly unknown[], DarwinThreadView][] {
    return queryClient
        .getQueryCache()
        .findAll({ queryKey: DARWIN_THREAD_QUERY_KEY })
        .flatMap((entry) => {
            const view = entry.state.data as DarwinThreadView | undefined;
            return view ? [[entry.queryKey, view] as [readonly unknown[], DarwinThreadView]] : [];
        });
}
