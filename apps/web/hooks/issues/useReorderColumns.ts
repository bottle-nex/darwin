import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { REORDER_COLUMNS_URL } from "@/routes/api_routes";
import { boardColumnsKey } from "@/hooks/issues/boardCache";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata } from "@/types/board";

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
        onMutate: (variables) => {
            const key = boardColumnsKey(variables.project_id);
            const previous = queryClient.getQueryData<BoardMetadata>(key);
            queryClient.setQueryData<BoardMetadata>(
                boardColumnsKey(variables.project_id),
                (data) => {
                    if (!data) return data;
                    const byId = new Map(data.columns.map((column) => [column.id, column]));
                    return {
                        ...data,
                        columns: variables.column_ids.flatMap((id, order) => {
                            const column = byId.get(id);
                            return column ? [{ ...column, order }] : [];
                        }),
                    };
                },
            );
            return { key, previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) queryClient.setQueryData(context.key, context.previous);
        },
    });
}
