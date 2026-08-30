"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { apiClient } from "@/lib/axios";
import { BOARD_COLUMNS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardChapter, BoardColumn, BoardMetadata } from "@/types/board";

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
const NO_COLUMNS: BoardColumn[] = [];

export function useChapters(projectId: string | undefined) {
    const { data } = useBoardColumns(projectId);
    return data?.chapters ?? NO_CHAPTERS;
}

export type ChapterBoard = BoardChapter & { columns: BoardColumn[] };

/** Each chapter with the columns it owns — the shape every chapter-grouped picker needs. */
export function useChapterBoards(projectId: string | undefined): ChapterBoard[] {
    const { data } = useBoardColumns(projectId);

    return useMemo(() => {
        const chapters = data?.chapters ?? NO_CHAPTERS;
        const columns = data?.columns ?? NO_COLUMNS;
        return chapters.map((chapter) => ({
            ...chapter,
            columns: columns.filter((column) => column.chapterId === chapter.id),
        }));
    }, [data]);
}
