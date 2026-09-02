import { Octokit } from "@octokit/rest";
import {
    type ReviewActor,
    type ReviewComment,
    type ReviewCommit,
    type ReviewFile,
    type ReviewFileStatus,
    type ReviewLabel,
    ReviewMergeMethod,
    type ReviewState,
} from "@trymatcha/types";

import GithubAppService from "./service.github_app";

export interface PullRequestRef {
    installationId: number;
    owner: string;
    repo: string;
    pullNumber: number;
}

export interface PullRequestDetail {
    title: string;
    body: string | null;
    htmlUrl: string;
    state: ReviewState;
    draft: boolean;
    author: ReviewActor | null;
    baseBranch: string;
    headBranch: string;
    baseSha: string;
    headSha: string;
    mergeable: boolean | null;
    mergeableState: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    commits: number;
    comments: number;
    labels: ReviewLabel[];
    reviewers: ReviewActor[];
    createdAt: string;
    updatedAt: string;
}

interface GithubUser {
    login: string;
    avatar_url?: string | null;
}

function actor(user: GithubUser | null | undefined): ReviewActor | null {
    if (!user) return null;
    return { login: user.login, avatarUrl: user.avatar_url ?? null };
}

export class ReviewDeleteUnsupportedError extends Error {
    constructor() {
        super("GitHub reviews cannot be deleted, only edited or dismissed.");
        this.name = "ReviewDeleteUnsupportedError";
    }
}

type GithubFile = {
    filename: string;
    previous_filename?: string;
    status: string;
    additions: number;
    deletions: number;
    blob_url?: string;
    patch?: string;
};

function reviewFile(file: GithubFile): ReviewFile {
    return {
        filename: file.filename,
        previousFilename: file.previous_filename ?? null,
        status: file.status as ReviewFileStatus,
        additions: file.additions,
        deletions: file.deletions,
        htmlUrl: file.blob_url ?? null,
        patch: file.patch ?? null,
    };
}

function parseCommentId(commentId: string): { kind: string; id: number } {
    const [kind, rawId] = commentId.split(":");
    return { kind: kind ?? "", id: Number(rawId) };
}

export default class GithubPullsService {
    static async getPullRequest(
        installationId: number,
        owner: string,
        repo: string,
        pullNumber: number,
    ): Promise<{ state: string; baseSha: string; headSha: string }> {
        const octokit = await GithubAppService.octokitFor(installationId);
        const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
        return { state: data.state, baseSha: data.base.sha, headSha: data.head.sha };
    }

    static async getPullRequestDetail(ref: PullRequestRef): Promise<PullRequestDetail> {
        const octokit = await GithubAppService.octokitFor(ref.installationId);
        const { data } = await octokit.rest.pulls.get({
            owner: ref.owner,
            repo: ref.repo,
            pull_number: ref.pullNumber,
        });
        return {
            title: data.title,
            body: data.body ?? null,
            htmlUrl: data.html_url,
            state: data.merged_at ? "merged" : (data.state as ReviewState),
            draft: data.draft ?? false,
            author: actor(data.user),
            baseBranch: data.base.ref,
            headBranch: data.head.ref,
            baseSha: data.base.sha,
            headSha: data.head.sha,
            mergeable: data.mergeable,
            mergeableState: data.mergeable_state,
            additions: data.additions,
            deletions: data.deletions,
            changedFiles: data.changed_files,
            commits: data.commits,
            comments: data.comments + data.review_comments,
            labels: data.labels.map((label) => ({ name: label.name, color: label.color })),
            reviewers: (data.requested_reviewers ?? []).map((user) => actor(user)!).filter(Boolean),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }

    static async findOpenPullRequestByBranch(
        installationId: number,
        owner: string,
        repo: string,
        branch: string,
    ): Promise<{ url: string } | null> {
        const octokit = await GithubAppService.octokitFor(installationId);
        const { data } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: "open",
            head: `${owner}:${branch}`,
            per_page: 1,
        });
        return data[0] ? { url: data[0].html_url } : null;
    }

    static async listPullRequestCommits(ref: PullRequestRef): Promise<ReviewCommit[]> {
        const octokit = await GithubAppService.octokitFor(ref.installationId);
        const commits = await octokit.paginate(octokit.rest.pulls.listCommits, {
            owner: ref.owner,
            repo: ref.repo,
            pull_number: ref.pullNumber,
            per_page: 100,
        });
        return commits.map((entry) => ({
            sha: entry.sha,
            subject: entry.commit.message.split("\n")[0] ?? "",
            htmlUrl: entry.html_url,
            author: actor(entry.author as GithubUser | null),
            committedAt: entry.commit.committer?.date ?? entry.commit.author?.date ?? null,
        }));
    }

    static async listPullRequestFiles(ref: PullRequestRef): Promise<ReviewFile[]> {
        const octokit = await GithubAppService.octokitFor(ref.installationId);
        const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
            owner: ref.owner,
            repo: ref.repo,
            pull_number: ref.pullNumber,
            per_page: 100,
        });
        return files.map(reviewFile);
    }

    static async listCommitFiles(ref: PullRequestRef, sha: string): Promise<ReviewFile[]> {
        const octokit = await GithubAppService.octokitFor(ref.installationId);
        try {
            const { data } = await octokit.rest.repos.getCommit({
                owner: ref.owner,
                repo: ref.repo,
                ref: sha,
            });
            return (data.files ?? []).map(reviewFile);
        } catch (error) {
            // A stale link naming a commit that was rebased away is a normal thing to hold, so it
            // reads as a pull request with nothing in it rather than a broken pane.
            if ((error as { status?: number }).status === 404) return [];
            throw error;
        }
    }

    static async getFileSource(
        ref: Omit<PullRequestRef, "pullNumber">,
        path: string,
        commitSha: string,
    ): Promise<string | null> {
        const octokit = await GithubAppService.octokitFor(ref.installationId);
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner: ref.owner,
                repo: ref.repo,
                path,
                ref: commitSha,
            });
            if (Array.isArray(data) || data.type !== "file") return null;
            if (data.encoding !== "base64" || !data.content) return null;
            return Buffer.from(data.content, "base64").toString("utf8");
        } catch {
            return null;
        }
    }

    static async listTimeline(ref: PullRequestRef): Promise<ReviewComment[]> {
        const octokit = await GithubAppService.octokitFor(ref.installationId);
        const target = { owner: ref.owner, repo: ref.repo };

        const [conversation, reviews, inline] = await Promise.all([
            octokit.paginate(octokit.rest.issues.listComments, {
                ...target,
                issue_number: ref.pullNumber,
                per_page: 100,
            }),
            octokit.paginate(octokit.rest.pulls.listReviews, {
                ...target,
                pull_number: ref.pullNumber,
                per_page: 100,
            }),
            octokit.paginate(octokit.rest.pulls.listReviewComments, {
                ...target,
                pull_number: ref.pullNumber,
                per_page: 100,
            }),
        ]);

        const timeline: ReviewComment[] = [
            ...conversation.map((item) => ({
                id: `conversation:${item.id}`,
                kind: "conversation" as const,
                author: actor(item.user),
                body: item.body ?? "",
                createdAt: item.created_at,
                htmlUrl: item.html_url,
                state: null,
                path: null,
                line: null,
                diffHunk: null,
            })),
            ...reviews
                .filter((item) => (item.body ?? "").trim().length > 0)
                .map((item) => ({
                    id: `review:${item.id}`,
                    kind: "review" as const,
                    author: actor(item.user),
                    body: item.body ?? "",
                    createdAt: item.submitted_at ?? new Date(0).toISOString(),
                    htmlUrl: item.html_url,
                    state: item.state.toLowerCase(),
                    path: null,
                    line: null,
                    diffHunk: null,
                })),
            ...inline.map((item) => ({
                id: `inline:${item.id}`,
                kind: "inline" as const,
                author: actor(item.user),
                body: item.body ?? "",
                createdAt: item.created_at,
                htmlUrl: item.html_url,
                state: null,
                path: item.path,
                line: item.line ?? item.original_line ?? null,
                diffHunk: item.diff_hunk ?? null,
            })),
        ];

        return timeline.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    static async createComment(
        userToken: string,
        ref: Omit<PullRequestRef, "installationId">,
        body: string,
    ): Promise<ReviewComment> {
        const octokit = new Octokit({ auth: userToken });
        const { data } = await octokit.rest.issues.createComment({
            owner: ref.owner,
            repo: ref.repo,
            issue_number: ref.pullNumber,
            body,
        });
        return {
            id: `conversation:${data.id}`,
            kind: "conversation",
            author: actor(data.user),
            body: data.body ?? "",
            createdAt: data.created_at,
            htmlUrl: data.html_url,
            state: null,
            path: null,
            line: null,
            diffHunk: null,
        };
    }

    static async updateComment(
        userToken: string,
        ref: Omit<PullRequestRef, "installationId">,
        commentId: string,
        body: string,
    ): Promise<ReviewComment> {
        const octokit = new Octokit({ auth: userToken });
        const { kind, id } = parseCommentId(commentId);
        const target = { owner: ref.owner, repo: ref.repo };

        if (kind === "inline") {
            const { data } = await octokit.rest.pulls.updateReviewComment({
                ...target,
                comment_id: id,
                body,
            });
            return {
                id: `inline:${data.id}`,
                kind: "inline",
                author: actor(data.user),
                body: data.body ?? "",
                createdAt: data.created_at,
                htmlUrl: data.html_url,
                state: null,
                path: data.path,
                line: data.line ?? data.original_line ?? null,
                diffHunk: data.diff_hunk ?? null,
            };
        }

        if (kind === "review") {
            const { data } = await octokit.rest.pulls.updateReview({
                ...target,
                pull_number: ref.pullNumber,
                review_id: id,
                body,
            });
            return {
                id: `review:${data.id}`,
                kind: "review",
                author: actor(data.user),
                body: data.body ?? "",
                createdAt: data.submitted_at ?? new Date(0).toISOString(),
                htmlUrl: data.html_url,
                state: data.state.toLowerCase(),
                path: null,
                line: null,
                diffHunk: null,
            };
        }

        const { data } = await octokit.rest.issues.updateComment({
            ...target,
            comment_id: id,
            body,
        });
        return {
            id: `conversation:${data.id}`,
            kind: "conversation",
            author: actor(data.user),
            body: data.body ?? "",
            createdAt: data.created_at,
            htmlUrl: data.html_url,
            state: null,
            path: null,
            line: null,
            diffHunk: null,
        };
    }

    static async deleteComment(
        userToken: string,
        ref: Omit<PullRequestRef, "installationId">,
        commentId: string,
    ): Promise<void> {
        const { kind, id } = parseCommentId(commentId);
        if (kind === "review") throw new ReviewDeleteUnsupportedError();

        const octokit = new Octokit({ auth: userToken });
        const target = { owner: ref.owner, repo: ref.repo };

        if (kind === "inline") {
            await octokit.rest.pulls.deleteReviewComment({ ...target, comment_id: id });
            return;
        }
        await octokit.rest.issues.deleteComment({ ...target, comment_id: id });
    }

    static async mergePullRequest(
        userToken: string,
        ref: Omit<PullRequestRef, "installationId">,
        method: ReviewMergeMethod = ReviewMergeMethod.Squash,
    ): Promise<void> {
        const octokit = new Octokit({ auth: userToken });
        await octokit.rest.pulls.merge({
            owner: ref.owner,
            repo: ref.repo,
            pull_number: ref.pullNumber,
            merge_method: method,
        });
    }

    static async closePullRequest(
        userToken: string,
        ref: Omit<PullRequestRef, "installationId">,
    ): Promise<void> {
        const octokit = new Octokit({ auth: userToken });
        await octokit.rest.pulls.update({
            owner: ref.owner,
            repo: ref.repo,
            pull_number: ref.pullNumber,
            state: "closed",
        });
    }
}
