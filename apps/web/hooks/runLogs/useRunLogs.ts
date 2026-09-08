"use client";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    InboundSocketMessageType,
    type RunLogEvent,
    type RunLogPage,
    RunLogState,
} from "@trydarwin/types";
import { useEffect } from "react";

import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { apiClient } from "@/lib/axios";
import { RUN_LOGS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { appendToRunLogPage, mergeRunLogPage, sealRunLogPage } from "./runLogCache";

export const RUN_LOGS_QUERY_KEY = ["run-logs"] as const;

export function queryKeyFor(runId: string) {
    return [...RUN_LOGS_QUERY_KEY, runId] as const;
}

export function useRunLogs(runId: string | undefined, isSocketConnected: boolean) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeyFor(runId ?? ""),
        enabled: Boolean(runId),
        queryFn: async ({ signal }) => {
            const res = await apiClient.get<ApiResponse<RunLogPage>>(RUN_LOGS_URL(runId!), {
                signal,
            });
            const existing = queryClient.getQueryData<RunLogPage>(queryKeyFor(runId!));
            return existing ? mergeRunLogPage(existing, res.data.data) : res.data.data;
        },
    });

    const isLive = query.data?.state === RunLogState.Live;

    useEffect(() => {
        if (!runId || !isSocketConnected || !isLive) return;

        send_socket_message({
            type: InboundSocketMessageType.RUN_LOG_SUBSCRIBE,
            payload: { runId },
        });
        void queryClient.refetchQueries({ queryKey: queryKeyFor(runId), exact: true });

        return () => {
            send_socket_message({
                type: InboundSocketMessageType.RUN_LOG_UNSUBSCRIBE,
                payload: { runId },
            });
        };
    }, [runId, isSocketConnected, isLive, queryClient]);

    return query;
}

export function append_run_log_events(
    queryClient: QueryClient,
    runId: string,
    events: RunLogEvent[],
    cursor: number,
) {
    queryClient.setQueryData<RunLogPage>(queryKeyFor(runId), (previous) =>
        previous ? appendToRunLogPage(previous, events, cursor) : previous,
    );
}

export function seal_run_log(queryClient: QueryClient, runId: string, droppedEvents: number) {
    queryClient.setQueryData<RunLogPage>(queryKeyFor(runId), (previous) =>
        previous ? sealRunLogPage(previous, droppedEvents) : previous,
    );
}
