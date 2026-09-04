import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { ISSUE_QUESTIONS_URL, QUESTION_ANSWER_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export interface PendingQuestion {
    id: string;
    key: string;
    prompt: string;
    type: string;
    options: string[];
    askedAt: string;
}

export const ISSUE_QUESTIONS_QUERY_KEY = (issueId: string) => ["issue", issueId, "questions"];

export function useIssueQuestions(issueId: string | undefined) {
    return useQuery({
        queryKey: ISSUE_QUESTIONS_QUERY_KEY(issueId ?? ""),
        enabled: Boolean(issueId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<PendingQuestion[]>>(
                ISSUE_QUESTIONS_URL(issueId!),
            );
            return res.data.data;
        },
    });
}

export function useAnswerQuestion(issueId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ questionId, value }: { questionId: string; value: string }) => {
            await apiClient.post(QUESTION_ANSWER_URL(questionId), { value });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ISSUE_QUESTIONS_QUERY_KEY(issueId) });
        },
    });
}
