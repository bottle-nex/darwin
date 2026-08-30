import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { boardColumnsKey } from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { CREATE_SPACE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata, BoardSpace } from "@/types/board";

export interface CreateSpaceInput {
    project_id: string;
    name: string;
    slug: string;
    description?: string | null;
    start_date?: string | null;
    target_date?: string | null;
    icon?: IconPick | null;
}

export function useCreateSpace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateSpaceInput) => {
            const res = await apiClient.post<ApiResponse<{ space: BoardSpace }>>(
                CREATE_SPACE_URL,
                input,
            );
            return res.data.data.space;
        },
        onSuccess: (space, variables) => {
            queryClient.setQueryData<BoardMetadata>(
                boardColumnsKey(variables.project_id),
                (data) => {
                    if (!data) return data;
                    return {
                        ...data,
                        spaces: [...data.spaces.filter((row) => row.id !== space.id), space],
                    };
                },
            );
        },
    });
}
