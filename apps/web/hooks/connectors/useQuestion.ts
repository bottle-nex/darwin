import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { QUESTION_SECRET_URL, QUESTION_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export interface AgentQuestionDetail {
    id: string;
    key: string;
    prompt: string;
    type: string;
    status: string;
    projectName: string | null;
}

export const QUESTION_QUERY_KEY = (questionId: string) => ["question", questionId];

export function useQuestion(questionId: string) {
    return useQuery({
        queryKey: QUESTION_QUERY_KEY(questionId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<AgentQuestionDetail>>(
                QUESTION_URL(questionId),
            );
            return res.data.data;
        },
    });
}

export function useAnswerSecret(questionId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (value: string) => {
            await apiClient.post(QUESTION_SECRET_URL(questionId), { value });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUESTION_QUERY_KEY(questionId) });
        },
    });
}
