import { useMutation, useQueryClient } from "@tanstack/react-query";

import { boardColumnsKey } from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { REORDER_COLUMNS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata } from "@/types/board";

export interface ReorderColumnsInput {
    project_id: string;
    space_id: string;
    column_ids: string[];
}

/** Persists the requesting user's personal column order for one space. */
export function useReorderColumns() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ space_id, column_ids }: ReorderColumnsInput) => {
            await apiClient.patch<ApiResponse<{ ok: boolean }>>(REORDER_COLUMNS_URL, {
                space_id,
                column_ids,
            });
        },
        onMutate: (variables) => {
            const key = boardColumnsKey(variables.project_id);
            const previous = queryClient.getQueryData<BoardMetadata>(key);
            queryClient.setQueryData<BoardMetadata>(key, (data) => {
                if (!data) return data;
                const byId = new Map(data.columns.map((column) => [column.id, column]));
                const reordered = variables.column_ids.flatMap((id, order) => {
                    const column = byId.get(id);
                    return column?.spaceId === variables.space_id ? [{ ...column, order }] : [];
                });
                let next = 0;
                return {
                    ...data,
                    columns: data.columns.map((column) =>
                        column.spaceId === variables.space_id
                            ? (reordered[next++] ?? column)
                            : column,
                    ),
                };
            });
            return { key, previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) queryClient.setQueryData(context.key, context.previous);
        },
    });
}
