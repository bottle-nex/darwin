import { useMutation, useQueryClient } from "@tanstack/react-query";

import { boardColumnsKey } from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { CREATE_COLUMN_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata } from "@/types/board";

export interface CreateColumnInput {
    project_id: string;
    space_id: string;
    label: string;
}

export interface CreatedColumn {
    id: string;
    spaceId: string;
    label: string;
    order: number;
}

export function useCreateColumn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ space_id, label }: CreateColumnInput) => {
            const res = await apiClient.post<ApiResponse<{ column: CreatedColumn }>>(
                CREATE_COLUMN_URL,
                { space_id, label },
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
                        columns: [...data.columns.filter((row) => row.id !== column.id), column],
                        totals: {
                            ...data.totals,
                            custom: { ...data.totals.custom, [column.id]: 0 },
                        },
                    };
                },
            );
        },
    });
}
