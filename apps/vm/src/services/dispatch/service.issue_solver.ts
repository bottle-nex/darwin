import type { Effort } from "@trymatcha/database";
import { Harness, IssueStatus, prisma } from "@trymatcha/database";
import type Logger from "@trymatcha/logger";

import { ENV } from "../../conf/config.env";

export interface ClaimedIssue {
    id: string;
    number: number;
    title: string;
    description: string;
    prBranch: string;
    agentDoneAt: Date | null;
    harness: Harness;
    model: string;
    effort: Effort | null;
}

function resolve_config(
    config: { harness: Harness; model: string; effort: Effort | null } | null,
): {
    harness: Harness;
    model: string;
    effort: Effort | null;
} {
    return config ?? { harness: Harness.Claude, model: ENV.SERVER_SOLVE_MODEL, effort: null };
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
                issueConfig: { select: { harness: true, model: true, effort: true } },
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
            const { issueConfig: resuming_config, ...resuming_rest } = unfinished_issue;
            return { ...resuming_rest, prBranch: pr_branch, ...resolve_config(resuming_config) };
        }

        const issue = await prisma.issue.findFirst({
            where: { assignerWorkerId: worker_id, status: IssueStatus.Queued },
            orderBy: { queuePosition: "asc" },
            select: {
                id: true,
                number: true,
                title: true,
                description: true,
                agentDoneAt: true,
                issueConfig: { select: { harness: true, model: true, effort: true } },
            },
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
        const { issueConfig: claimed_config, ...claimed_rest } = issue;
        return { ...claimed_rest, prBranch: pr_branch, ...resolve_config(claimed_config) };
    }

    private static pr_branch(issue_id: string): string {
        return `matcha/issue-${issue_id}`;
    }
}
