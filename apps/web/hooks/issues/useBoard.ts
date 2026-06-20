import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { BOARD_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardResponse } from "@/types/board";

export const BOARD_QUERY_KEY = ["board"] as const;

/** Hydrate the kanban for a project: all custom columns + all issues with assignees. */
export function useBoard(projectId: string | undefined) {
    return useQuery({
        queryKey: [...BOARD_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<BoardResponse>>(BOARD_URL(projectId!));
            return res.data.data;
        },
    });
}
