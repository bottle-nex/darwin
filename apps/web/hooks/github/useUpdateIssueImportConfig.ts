"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { ISSUE_IMPORT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { IssueImportConfig, UpdateIssueImportInput } from "@/types/issueImport";

import { ISSUE_IMPORT_QUERY_KEY } from "./useIssueImportConfig";

export function useUpdateIssueImportConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, ...input }: UpdateIssueImportInput) => {
            const res = await apiClient.patch<
                ApiResponse<Omit<IssueImportConfig, "importedCount" | "lastImportedAt">>
            >(ISSUE_IMPORT_URL(projectId), {
                enabled: input.enabled,
                target: input.target,
                custom_column_id: input.customColumnId,
                tag_id: input.tagId,
                backfill: input.backfill,
            });
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...ISSUE_IMPORT_QUERY_KEY, variables.projectId],
            });
        },
    });
}
