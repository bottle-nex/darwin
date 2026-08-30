"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { apiClient } from "@/lib/axios";
import { BOARD_COLUMNS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardColumn, BoardMetadata, BoardSpace } from "@/types/board";

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

const NO_SPACES: BoardSpace[] = [];
const NO_COLUMNS: BoardColumn[] = [];

export function useSpaces(projectId: string | undefined) {
    const { data } = useBoardColumns(projectId);
    return data?.spaces ?? NO_SPACES;
}

export type SpaceBoard = BoardSpace & { columns: BoardColumn[] };

/** Each space with the columns it owns — the shape every space-grouped picker needs. */
export function useSpaceBoards(projectId: string | undefined): SpaceBoard[] {
    const { data } = useBoardColumns(projectId);

    return useMemo(() => {
        const spaces = data?.spaces ?? NO_SPACES;
        const columns = data?.columns ?? NO_COLUMNS;
        return spaces.map((space) => ({
            ...space,
            columns: columns.filter((column) => column.spaceId === space.id),
        }));
    }, [data]);
}
