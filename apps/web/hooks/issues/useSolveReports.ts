"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { ISSUE_SOLVE_REPORTS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { SolveReport } from "@/types/solveReport.type";

export const SOLVE_REPORTS_QUERY_KEY = ["solve-reports"] as const;

export function solveReportsKey(issueId: string) {
    return [...SOLVE_REPORTS_QUERY_KEY, issueId] as const;
}

export function useSolveReports(issueId: string | undefined) {
    return useQuery({
        queryKey: solveReportsKey(issueId ?? ""),
        enabled: Boolean(issueId),
        queryFn: async ({ signal }) => {
            const response = await apiClient.get<ApiResponse<{ reports: SolveReport[] }>>(
                ISSUE_SOLVE_REPORTS_URL(issueId!),
                { signal },
            );
            return response.data.data.reports;
        },
    });
}
