import type { IssueStatus } from "../prisma/enums.prisma";

export const MIN_GLOBAL_SEARCH_QUERY_LENGTH = 2;
export const MAX_GLOBAL_SEARCH_QUERY_LENGTH = 200;
export const GLOBAL_SEARCH_GROUP_CAP = 8;

export interface GlobalSearchIssueHit {
    id: string;
    number: number;
    title: string;
    status: IssueStatus;
    snippet: string | null;
}

export type GlobalSearchMessageThread =
    | { kind: "issue-comment"; issueId: string; issueNumber: number; issueTitle: string }
    | { kind: "project-chat" }
    | { kind: "team-chat"; teamId: string; teamName: string };

export interface GlobalSearchMessageHit {
    id: string;
    createdAt: string;
    snippet: string;
    senderName: string | null;
    thread: GlobalSearchMessageThread;
}

export interface GlobalSearchResult {
    issues: GlobalSearchIssueHit[];
    messages: GlobalSearchMessageHit[];
}
