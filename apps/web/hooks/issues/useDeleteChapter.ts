import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    BOARD_LANE_QUERY_KEY,
    BOARD_SEARCH_QUERY_KEY,
    boardColumnsKey,
    ISSUE_QUERY_KEY,
    MY_ISSUES_QUERY_KEY,
} from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { CHAPTER_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardMetadata } from "@/types/board";

export interface DeleteChapterInput {
    id: string;
    project_id: string;
}

export function useDeleteChapter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }: DeleteChapterInput) => {
            const res = await apiClient.delete<
                ApiResponse<{ ok: boolean; deleted_columns: number; released_issues: number }>
            >(CHAPTER_URL(id));
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            const key = boardColumnsKey(variables.project_id);
            const removed = (queryClient.getQueryData<BoardMetadata>(key)?.columns ?? []).filter(
                (column) => column.chapterId === variables.id,
            );

            queryClient.setQueryData<BoardMetadata>(key, (data) => {
                if (!data) return data;
                const custom = { ...data.totals.custom };
                for (const column of removed) delete custom[column.id];
                return {
                    ...data,
                    chapters: data.chapters.filter((chapter) => chapter.id !== variables.id),
                    columns: data.columns.filter((column) => column.chapterId !== variables.id),
                    totals: { ...data.totals, custom },
                };
            });

            for (const column of removed) {
                queryClient.removeQueries({
                    queryKey: [...BOARD_LANE_QUERY_KEY, variables.project_id, "custom", column.id],
                });
            }
            queryClient.removeQueries({
                queryKey: [...ISSUE_QUERY_KEY, variables.project_id],
            });
            // The chapter's issues were released back onto the agent board, so its
            // lanes are now stale too — not just the custom ones that went away.
            queryClient.invalidateQueries({
                queryKey: [...BOARD_LANE_QUERY_KEY, variables.project_id],
            });
            queryClient.invalidateQueries({
                queryKey: [...BOARD_SEARCH_QUERY_KEY, variables.project_id],
            });
            queryClient.invalidateQueries({
                queryKey: [...MY_ISSUES_QUERY_KEY, variables.project_id],
            });
            queryClient.invalidateQueries({ queryKey: key });
        },
    });
}
