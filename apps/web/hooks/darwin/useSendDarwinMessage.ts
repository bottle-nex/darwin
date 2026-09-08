"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { DARWIN_CANCEL_RUN_URL, DARWIN_MESSAGES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { type DarwinThreadView, emptyLiveTurn } from "./darwinCache";
import { darwinThreadKey } from "./useDarwinThread";
import { darwinThreadsKey } from "./useDarwinThreads";

type SendInput = {
    project_id: string;
    thread_id?: string;
    message: string;
};

type SendResult = { threadId: string; runId: string };

/**
 * Ask Darwin something.
 *
 * The POST returns a `runId` in milliseconds and the answer arrives over the socket, so this
 * mutation settles long before the reply exists. The user's own message is written into the cache
 * here rather than waiting for a refetch, so the composer clears against something visible.
 *
 * @example
 * const send = useSendDarwinMessage();
 * const { threadId, runId } = await send.mutateAsync({ project_id, message: "what's in review?" });
 */
export function useSendDarwinMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: SendInput) => {
            const res = await apiClient.post<ApiResponse<SendResult>>(DARWIN_MESSAGES_URL, input);
            return res.data.data;
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData<DarwinThreadView>(
                darwinThreadKey(data.threadId),
                (previous) =>
                    previous
                        ? {
                              ...previous,
                              activeRunId: data.runId,
                              live: emptyLiveTurn(data.runId),
                              messages: [
                                  ...previous.messages,
                                  {
                                      id: `${data.runId}:ask`,
                                      seq: Number.MAX_SAFE_INTEGER - 1,
                                      role: "user",
                                      content: variables.message,
                                      tools: [],
                                      createdAt: new Date().toISOString(),
                                  },
                              ],
                          }
                        : previous,
            );
            void queryClient.invalidateQueries({
                queryKey: darwinThreadsKey(variables.project_id),
            });
        },
    });
}

/**
 * Stop an answer mid-flight.
 *
 * `stopped: false` means the run had already finished, or it is being served by another server
 * instance — the cancel registry is per-process today.
 *
 * @example
 * await stop.mutateAsync({ project_id, run_id });
 */
export function useStopDarwinRun() {
    return useMutation({
        mutationFn: async (input: { project_id: string; run_id: string }) => {
            const res = await apiClient.post<ApiResponse<{ stopped: boolean }>>(
                DARWIN_CANCEL_RUN_URL(input.run_id),
                { project_id: input.project_id },
            );
            return res.data.data;
        },
    });
}
