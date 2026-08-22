import { prisma } from "@trymatcha/database";
import type { ReviewHeader } from "@trymatcha/types";
import GithubPullsService, { type PullRequestRef } from "./service.github_pulls";

export interface ResolvedReview {
    ref: PullRequestRef;
    issue: { id: string; number: number; title: string; prTitle: string | null };
}

export default class ReviewService {
    static async resolve(projectId: string, pullNumber: number): Promise<ResolvedReview | null> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                githubRepoFullName: true,
                githubInstallation: { select: { installationId: true } },
            },
        });
        if (!project?.githubRepoFullName || !project.githubInstallation) return null;

        const [owner, repo] = project.githubRepoFullName.split("/");
        if (!owner || !repo) return null;

        const issue = await prisma.issue.findFirst({
            where: { projectId, prNumber: pullNumber },
            select: { id: true, number: true, title: true, prTitle: true },
        });
        if (!issue) return null;

        return {
            ref: {
                installationId: Number(project.githubInstallation.installationId),
                owner,
                repo,
                pullNumber,
            },
            issue,
        };
    }

    static async header(resolved: ResolvedReview): Promise<ReviewHeader> {
        const { ref, issue } = resolved;
        const [pull, productDiff] = await Promise.all([
            GithubPullsService.getPullRequestDetail(ref),
            prisma.productDiff.findFirst({
                where: { issueId: issue.id },
                orderBy: { createdAt: "desc" },
                select: { id: true },
            }),
        ]);

        if (pull.title !== issue.prTitle) {
            await prisma.issue.update({
                where: { id: issue.id },
                data: { prTitle: pull.title },
            });
        }

        return {
            issueId: issue.id,
            issueNumber: issue.number,
            issueTitle: issue.title,
            pullNumber: ref.pullNumber,
            title: pull.title,
            htmlUrl: pull.htmlUrl,
            repo: `${ref.owner}/${ref.repo}`,
            state: pull.state,
            draft: pull.draft,
            author: pull.author,
            baseBranch: pull.baseBranch,
            headBranch: pull.headBranch,
            body: pull.body,
            additions: pull.additions,
            deletions: pull.deletions,
            changedFiles: pull.changedFiles,
            commits: pull.commits,
            comments: pull.comments,
            labels: pull.labels,
            reviewers: pull.reviewers,
            createdAt: pull.createdAt,
            updatedAt: pull.updatedAt,
            productDiffId: productDiff?.id ?? null,
        };
    }
}
