import { IssueStatus, prisma } from "@trymatcha/database";
import type Logger from "@trymatcha/logger";

export interface ClaimedIssue {
    id: string;
    number: number;
    title: string;
    description: string;
    prBranch: string;
    agentDoneAt: Date | null;
}

export default class IssueSolver {
    public static async claim_next_issue(
        worker_id: string,
        log: Logger,
    ): Promise<ClaimedIssue | null> {
        const unfinished_issue = await prisma.issue.findFirst({
            where: {
                assignerWorkerId: worker_id,
                status: IssueStatus.InProgress,
                prUrl: null,
            },
            orderBy: { queuePosition: "asc" },
            select: {
                id: true,
                number: true,
                title: true,
                description: true,
                prBranch: true,
                agentDoneAt: true,
            },
        });

        if (unfinished_issue) {
            const pr_branch = unfinished_issue.prBranch ?? this.pr_branch(unfinished_issue.id);
            if (!unfinished_issue.prBranch) {
                await prisma.issue.update({
                    where: { id: unfinished_issue.id },
                    data: { prBranch: pr_branch },
                });
            }
            log.step(`resuming issue #${unfinished_issue.number}`, {
                title: unfinished_issue.title,
            });
            return { ...unfinished_issue, prBranch: pr_branch };
        }

        const issue = await prisma.issue.findFirst({
            where: { assignerWorkerId: worker_id, status: IssueStatus.Queued },
            orderBy: { queuePosition: "asc" },
            select: { id: true, number: true, title: true, description: true, agentDoneAt: true },
        });

        if (!issue) {
            log.info("no queued issue left for this worker");
            return null;
        }

        const pr_branch = this.pr_branch(issue.id);
        const claim = await prisma.issue.updateMany({
            where: { id: issue.id, status: IssueStatus.Queued },
            data: { status: IssueStatus.InProgress, prBranch: pr_branch },
        });

        if (claim.count === 0) {
            log.warn("issue already claimed by another run — skipping", { issue: issue.id });
            return null;
        }

        log.step(`claimed issue #${issue.number}`, { title: issue.title });
        return { ...issue, prBranch: pr_branch };
    }

    private static pr_branch(issue_id: string): string {
        return `matcha/issue-${issue_id}`;
    }
}
