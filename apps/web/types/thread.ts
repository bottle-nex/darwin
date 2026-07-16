/** Raw server shape for one row in the Threads sidebar's issue-chat list. */
export interface IssueThreadSummary {
    id: string;
    number: number;
    title: string;
    lastMessage: { message: string; createdAt: string } | null;
}
