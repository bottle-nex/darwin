import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    BOARD_LANE_QUERY_KEY,
    BOARD_SEARCH_QUERY_KEY,
    boardColumnsKey,
    ISSUE_QUERY_KEY,
    MY_ISSUES_QUERY_KEY,
} from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { COLUMN_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata } from "@/types/board";

export interface DeleteColumnInput {
    id: string;
    project_id: string;
}

export function useDeleteColumn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }: DeleteColumnInput) => {
            const res = await apiClient.delete<
                ApiResponse<{ ok: boolean; deleted_issues: number }>
            >(COLUMN_URL(id));
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.setQueryData<BoardMetadata>(
                boardColumnsKey(variables.project_id),
                (data) => {
                    if (!data) return data;
                    const custom = { ...data.totals.custom };
                    delete custom[variables.id];
                    return {
                        columns: data.columns.filter((column) => column.id !== variables.id),
                        totals: { ...data.totals, custom },
                    };
                },
            );
            queryClient.removeQueries({
                queryKey: [...BOARD_LANE_QUERY_KEY, variables.project_id, "custom", variables.id],
            });
            queryClient.removeQueries({
                queryKey: [...ISSUE_QUERY_KEY, variables.project_id],
            });
            queryClient.invalidateQueries({
                queryKey: [...BOARD_SEARCH_QUERY_KEY, variables.project_id],
            });
            queryClient.invalidateQueries({
                queryKey: [...MY_ISSUES_QUERY_KEY, variables.project_id],
            });
        },
    });
}
