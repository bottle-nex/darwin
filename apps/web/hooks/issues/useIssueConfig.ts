"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ISSUE_CONFIG_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { Effort, Harness, IssueConfigResponse } from "@/types/harness.type";

function issueConfigKey(issueId: string) {
    return ["issue", issueId, "config"];
}

export function useGetIssueConfig(issueId: string | undefined) {
    return useQuery({
        queryKey: issueConfigKey(issueId ?? ""),
        enabled: Boolean(issueId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<IssueConfigResponse>>(
                ISSUE_CONFIG_URL(issueId!),
            );
            return res.data.data;
        },
    });
}

interface SetIssueConfigInput {
    issueId: string;
    harness: Harness;
    model: string;
    effort?: Effort;
}

export function useSetIssueConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ issueId, ...body }: SetIssueConfigInput) => {
            const res = await apiClient.put<ApiResponse<{ config: unknown }>>(
                ISSUE_CONFIG_URL(issueId),
                body,
            );
            return res.data.data;
        },
        onSuccess: (_data, { issueId }) => {
            queryClient.invalidateQueries({ queryKey: issueConfigKey(issueId) });
        },
    });
}
