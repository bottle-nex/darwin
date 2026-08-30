"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { ISSUE_IMPORT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { IssueImportConfig } from "@/types/issueImport";

export const ISSUE_IMPORT_QUERY_KEY = ["issue-import"] as const;

export function useIssueImportConfig(projectId: string | undefined) {
    return useQuery({
        queryKey: [...ISSUE_IMPORT_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async ({ signal }) => {
            const res = await apiClient.get<ApiResponse<IssueImportConfig>>(
                ISSUE_IMPORT_URL(projectId!),
                { signal },
            );
            return res.data.data;
        },
    });
}
