import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { boardColumnsKey } from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { SPACE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata, BoardSpace } from "@/types/board";

export interface UpdateSpaceInput {
    id: string;
    project_id: string;
    name?: string;
    slug?: string;
    /** `null` clears the description; omitting it leaves the description alone. */
    description?: string | null;
    /** `null` clears the start date; omitting it leaves the date alone. */
    start_date?: string | null;
    /** `null` clears the target date; omitting it leaves the date alone. */
    target_date?: string | null;
    /** `null` clears the icon; omitting it leaves the icon alone. */
    icon?: IconPick | null;
}

export function useUpdateSpace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            name,
            slug,
            description,
            start_date,
            target_date,
            icon,
        }: UpdateSpaceInput) => {
            const res = await apiClient.patch<ApiResponse<{ space: BoardSpace }>>(SPACE_URL(id), {
                name,
                slug,
                description,
                start_date,
                target_date,
                icon,
            });
            return res.data.data.space;
        },
        onSuccess: (space, variables) => {
            queryClient.setQueryData<BoardMetadata>(
                boardColumnsKey(variables.project_id),
                (data) => {
                    if (!data) return data;
                    return {
                        ...data,
                        spaces: data.spaces.map((row) => (row.id === space.id ? space : row)),
                    };
                },
            );
        },
    });
}
