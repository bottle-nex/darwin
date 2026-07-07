import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { COLUMN_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";
import type { BoardColumn } from "@/types/board";

export interface UpdateColumnInput {
    id: string;
    project_id: string;
    label?: string;
    order?: number;
    /** Hex like "#9bc24f", or null to clear back to the default column colour. */
    color?: string | null;
}

export function useUpdateColumn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateColumnInput) => {
            const res = await apiClient.patch<ApiResponse<{ column: BoardColumn }>>(
                COLUMN_URL(input.id),
                { label: input.label, order: input.order, color: input.color },
            );
            return res.data.data.column;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...BOARD_QUERY_KEY, variables.project_id],
            });
        },
    });
}
