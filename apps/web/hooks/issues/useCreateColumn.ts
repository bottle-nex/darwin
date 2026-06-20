import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CREATE_COLUMN_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export interface CreateColumnInput {
    project_id: string;
    label: string;
}

export interface CreatedColumn {
    id: string;
    label: string;
    order: number;
}

export function useCreateColumn() {
    return useMutation({
        mutationFn: async (input: CreateColumnInput) => {
            const res = await apiClient.post<ApiResponse<{ column: CreatedColumn }>>(
                CREATE_COLUMN_URL,
                input,
            );
            return res.data.data.column;
        },
    });
}
