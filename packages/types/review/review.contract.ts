export const ReviewTab = {
    Changes: "changes",
    Diff: "diff",
    PullRequest: "pull-request",
} as const;
export type ReviewTab = (typeof ReviewTab)[keyof typeof ReviewTab];

export const ReviewState = {
    Open: "open",
    Closed: "closed",
    Merged: "merged",
} as const;
export type ReviewState = (typeof ReviewState)[keyof typeof ReviewState];

export const ReviewFileStatus = {
    Added: "added",
    Removed: "removed",
    Modified: "modified",
    Renamed: "renamed",
    Copied: "copied",
    Changed: "changed",
    Unchanged: "unchanged",
} as const;
export type ReviewFileStatus = (typeof ReviewFileStatus)[keyof typeof ReviewFileStatus];

export const ReviewCommentKind = {
    Conversation: "conversation",
    Review: "review",
    Inline: "inline",
} as const;
export type ReviewCommentKind = (typeof ReviewCommentKind)[keyof typeof ReviewCommentKind];

export interface ReviewActor {
    login: string;
    avatarUrl: string | null;
}

export interface ReviewLabel {
    name: string;
    color: string;
}

export interface ReviewHeader {
    issueId: string;
    issueNumber: number;
    issueTitle: string;
    pullNumber: number;
    title: string;
    htmlUrl: string;
    repo: string;
    state: ReviewState;
    draft: boolean;
    author: ReviewActor | null;
    baseBranch: string;
    headBranch: string;
    body: string | null;
    additions: number;
    deletions: number;
    changedFiles: number;
    commits: number;
    comments: number;
    labels: ReviewLabel[];
    reviewers: ReviewActor[];
    createdAt: string;
    updatedAt: string;
    productDiffId: string | null;
}

export interface ReviewFile {
    filename: string;
    previousFilename: string | null;
    status: ReviewFileStatus;
    additions: number;
    deletions: number;
    htmlUrl: string | null;
    patch: string | null;
}

export interface ReviewComment {
    id: string;
    kind: ReviewCommentKind;
    author: ReviewActor | null;
    body: string;
    createdAt: string;
    htmlUrl: string;
    state: string | null;
    path: string | null;
    line: number | null;
    diffHunk: string | null;
}

export interface ReviewFileSource {
    path: string;
    source: string | null;
    lines: number;
}
