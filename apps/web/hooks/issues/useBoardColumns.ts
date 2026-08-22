"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { boardColumnsKey } from "./boardCache";
import { BOARD_COLUMNS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata } from "@/types/board";

export function useBoardColumns(projectId: string | undefined) {
    return useQuery({
        queryKey: boardColumnsKey(projectId ?? ""),
        enabled: Boolean(projectId),
        queryFn: async ({ signal }) => {
            const response = await apiClient.get<ApiResponse<BoardMetadata>>(
                BOARD_COLUMNS_URL(projectId!),
                { signal },
            );
            return response.data.data;
        },
    });
}
