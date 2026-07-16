import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { REORDER_COLUMNS_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";

export interface ReorderColumnsInput {
    project_id: string;
    column_ids: string[];
}

/** Persists the requesting user's personal column order for a project. */
export function useReorderColumns() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: ReorderColumnsInput) => {
            await apiClient.patch<ApiResponse<{ ok: boolean }>>(REORDER_COLUMNS_URL, input);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...BOARD_QUERY_KEY, variables.project_id],
            });
        },
    });
}
