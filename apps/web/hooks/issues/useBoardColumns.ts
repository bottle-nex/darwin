"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { BOARD_COLUMNS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardChapter, BoardMetadata } from "@/types/board";

import { boardColumnsKey } from "./boardCache";

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

const NO_CHAPTERS: BoardChapter[] = [];

export function useChapters(projectId: string | undefined) {
    const { data } = useBoardColumns(projectId);
    return data?.chapters ?? NO_CHAPTERS;
}
