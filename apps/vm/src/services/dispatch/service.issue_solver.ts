import type { Effort } from "@trymatcha/database";
import { ActivityType, Harness, IssueStatus, prisma } from "@trymatcha/database";
import { Registry } from "@trymatcha/harness";
import type Logger from "@trymatcha/logger";
import {
    DESCRIPTION_REFERENCE_INCLUDE,
    description_reference_labels,
    issue_prompt_text,
    IssueBroadcastService,
} from "@trymatcha/services";
import type { ActivityPayloadMap } from "@trymatcha/types";

import { ENV } from "../../conf/config.env";

export interface PriorAttempt {
    attemptNumber: number;
    report: string;
}

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
    attemptNumber: number;
    priorAttempts: PriorAttempt[];
    reopenNote: string | null;
}

function resolve_config(
    config: { harness: Harness; model: string; effort: Effort | null } | null,
): {
    harness: Harness;
    model: string;
    effort: Effort | null;
} {
    if (!config) return { harness: Harness.Claude, model: ENV.VM_SOLVE_MODEL, effort: null };
    if (Registry.supportsModel(config.harness, config.model)) return config;
    return { ...config, model: Registry.get(config.harness).models[0] };
}

export default class IssueSolver {
    public static async claim_next_issue(
        worker_id: string,
        log: Logger,
    ): Promise<ClaimedIssue | null> {
        const unfinished_issue = await prisma.issue.findFirst({
            where: { assignerWorkerId: worker_id, status: IssueStatus.InProgress },
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
            return {
                ...resuming_rest,
                prBranch: pr_branch,
                description: await this.prompt_description(
                    unfinished_issue.id,
                    unfinished_issue.description,
                ),
                ...resolve_config(resuming_config),
                ...(await this.history_of(unfinished_issue.id)),
            };
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
        await this.announce_claim(issue.id, log);
        const { issueConfig: claimed_config, ...claimed_rest } = issue;
        return {
            ...claimed_rest,
            prBranch: pr_branch,
            description: await this.prompt_description(issue.id, issue.description),
            ...resolve_config(claimed_config),
            ...(await this.history_of(issue.id)),
        };
    }

    private static async prompt_description(issue_id: string, html: string): Promise<string> {
        const rows = await prisma.descriptionReference.findMany({
            where: { issueId: issue_id },
            include: DESCRIPTION_REFERENCE_INCLUDE,
        });
        return issue_prompt_text(html, description_reference_labels(rows));
    }

    private static async history_of(issue_id: string) {
        const [sessions, reopen] = await Promise.all([
            prisma.agentSession.findMany({
                where: { issueId: issue_id },
                orderBy: { attemptNumber: "asc" },
                select: { attemptNumber: true, report: true },
            }),
            prisma.issueActivity.findFirst({
                where: { issueId: issue_id, type: ActivityType.IssueReopened },
                orderBy: { seq: "desc" },
                select: { payload: true },
            }),
        ]);

        const reopen_payload = reopen
            ? (reopen.payload as unknown as ActivityPayloadMap["IssueReopened"])
            : null;
        const note = reopen_payload ? (reopen_payload.noteText ?? reopen_payload.note) : null;

        return {
            attemptNumber: sessions.length + 1,
            priorAttempts: sessions
                .filter((session): session is { attemptNumber: number; report: string } =>
                    Boolean(session.report),
                )
                .map((session) => ({
                    attemptNumber: session.attemptNumber,
                    report: session.report,
                })),
            reopenNote: note,
        };
    }

    /**
     * The claim above is the only place Queued → InProgress is written, so it is the only
     * place that can announce it. Best-effort: a realtime bus that is down must not cost us
     * an issue that is already claimed and ready to solve.
     */
    private static async announce_claim(issue_id: string, log: Logger) {
        try {
            const claimed = await prisma.issue.findUniqueOrThrow({
                where: { id: issue_id },
                include: { creator: true, assignees: true, tags: true },
            });
            await IssueBroadcastService.issue_updated(claimed.projectId, claimed, {
                status: IssueStatus.Queued,
                customColumnId: claimed.customColumnId,
            });
        } catch (error) {
            log.warn("claim not broadcast", { issue: issue_id, error: String(error) });
        }
    }

    private static pr_branch(issue_id: string): string {
        return `matcha/issue-${issue_id}`;
    }
}
