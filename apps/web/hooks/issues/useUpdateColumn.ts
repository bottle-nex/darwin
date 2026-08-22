import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { COLUMN_URL } from "@/routes/api_routes";
import { boardColumnsKey } from "@/hooks/issues/boardCache";
import type { ApiResponse } from "@/types/api";
import type { BoardColumn, BoardMetadata } from "@/types/board";

export interface UpdateColumnInput {
    id: string;
    project_id: string;
    label?: string;
    order?: number;
}

export function useUpdateColumn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateColumnInput) => {
            const res = await apiClient.patch<ApiResponse<{ column: BoardColumn }>>(
                COLUMN_URL(input.id),
                { label: input.label, order: input.order },
            );
            return res.data.data.column;
        },
        onSuccess: (column, variables) => {
            queryClient.setQueryData<BoardMetadata>(
                boardColumnsKey(variables.project_id),
                (data) => {
                    if (!data) return data;
                    return {
                        ...data,
                        columns: data.columns.map((row) => (row.id === column.id ? column : row)),
                    };
                },
            );
        },
    });
}
