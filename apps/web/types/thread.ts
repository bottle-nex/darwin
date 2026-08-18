import type { ServerIssueStatus } from "@/types/board";

/** Raw server shape for one row in the Threads sidebar's issue-chat list. */
export interface IssueThreadSummary {
    id: string;
    number: number;
    title: string;
    status: ServerIssueStatus;
    lastMessage: { message: string; createdAt: string } | null;
}
