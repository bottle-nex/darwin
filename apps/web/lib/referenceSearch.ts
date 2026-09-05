import type { QueryClient } from "@tanstack/react-query";
import type { IssueStatus } from "@trymatcha/types";

import { PROJECT_QUERY_KEY } from "@/hooks/project/useGetProject";
import { PROJECT_MEMBERS_QUERY_KEY, type ProjectMember } from "@/hooks/project/useProjectMembers";
import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";
import { apiClient } from "@/lib/axios";
import {
    GET_PROJECT,
    GET_TEAM_MEMBERS,
    LIST_PROJECT_MEMBERS_URL,
    SEARCH_ISSUES_URL,
} from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { ProjectDetail, ProjectTeam } from "@/types/project";
import type { TeamMembersData } from "@/types/team";

export type IssueSuggestion = {
    id: string;
    number: number;
    title: string;
    status: IssueStatus;
    priority: number;
};

export const ISSUE_SEARCH_QUERY_KEY = ["issue-search"] as const;

const SUGGESTION_STALE_TIME = 30_000;

export function search_members(
    queryClient: QueryClient,
    projectId: string,
    query: string,
): Promise<ProjectMember[]> {
    return queryClient.fetchQuery({
        queryKey: [...PROJECT_MEMBERS_QUERY_KEY, projectId, query],
        staleTime: SUGGESTION_STALE_TIME,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ members: ProjectMember[] }>>(
                LIST_PROJECT_MEMBERS_URL(projectId, query),
            );
            return res.data.data.members;
        },
    });
}

export function search_issues(
    queryClient: QueryClient,
    projectId: string,
    query: string,
): Promise<IssueSuggestion[]> {
    return queryClient.fetchQuery({
        queryKey: [...ISSUE_SEARCH_QUERY_KEY, projectId, query],
        staleTime: SUGGESTION_STALE_TIME,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ issues: IssueSuggestion[] }>>(
                SEARCH_ISSUES_URL(projectId, query),
            );
            return res.data.data.issues;
        },
    });
}

export async function search_teams(
    queryClient: QueryClient,
    projectId: string,
): Promise<ProjectTeam[]> {
    const project = await queryClient.fetchQuery({
        queryKey: [...PROJECT_QUERY_KEY, projectId],
        staleTime: SUGGESTION_STALE_TIME,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ProjectDetail>>(GET_PROJECT(projectId));
            return res.data.data;
        },
    });
    return project.teams.filter((team) => team.viewerRole !== null);
}

export async function team_member_user_ids(
    queryClient: QueryClient,
    teamId: string,
): Promise<string[]> {
    const team = await queryClient.fetchQuery({
        queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId],
        staleTime: SUGGESTION_STALE_TIME,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<TeamMembersData>>(GET_TEAM_MEMBERS(teamId));
            return res.data.data;
        },
    });
    return team.members.map((member) => member.user.id);
}
