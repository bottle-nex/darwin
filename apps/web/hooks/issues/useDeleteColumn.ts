import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { COLUMN_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";

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
            queryClient.invalidateQueries({
                queryKey: [...BOARD_QUERY_KEY, variables.project_id],
            });
        },
    });
}
