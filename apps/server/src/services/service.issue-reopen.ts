import { Action, Permissions } from "@trymatcha/access-control";
import { ActivityType, ActorType, IssueStatus, Prisma, prisma } from "@trymatcha/database";
import { ActivityService, IssueBroadcastService } from "@trymatcha/services";
import { isReopenable, ISSUE_LANE_NAME, to_plain_text } from "@trymatcha/types";
import z from "zod";

import { server_services } from "..";
import Access from "../access-control/access";
import { issue_recipients } from "../notifications/recipients";
import { location_of } from "./service.activity-diff";
import GithubPullsService from "./service.github_pulls";
import { ISSUE_ROW_INCLUDE, type IssueActor, type IssueRow } from "./service.issue";
import MessageReferenceService, { type ResolvedReferences } from "./service.message-references";

export const REOPEN_SCHEMA = z.object({
    note: z.string().trim().min(1).max(2000),
});

export type ReopenFailure = {
    ok: false;
    reason: "not_found" | "forbidden" | "conflict";
    message: string;
};

export type ReopenResult = { ok: true; issue: IssueRow } | ReopenFailure;

function conflict(message: string): ReopenFailure {
    return { ok: false, reason: "conflict", message };
}

async function pull_request_is_open(issue: {
    prNumber: number | null;
    project: {
        githubRepoFullName: string | null;
        githubInstallation: { installationId: bigint } | null;
    };
}): Promise<boolean> {
    const { prNumber, project } = issue;
    if (!prNumber || !project.githubRepoFullName || !project.githubInstallation) return true;

    const [owner, repo] = project.githubRepoFullName.split("/");
    if (!owner || !repo) return true;

    const pull = await GithubPullsService.getPullRequest(
        Number(project.githubInstallation.installationId),
        owner,
        repo,
        prNumber,
    );
    return pull.state === "open";
}

export default class IssueReopenService {
    static async reopen_issue(actor: IssueActor, id: string, note: string): Promise<ReopenResult> {
        const issue = await prisma.issue.findUnique({
            where: { id },
            select: {
                projectId: true,
                status: true,
                createdById: true,
                resolvedAt: true,
                prNumber: true,
                assignerWorkerId: true,
                customColumn: { select: { id: true, label: true } },
                assignees: { select: { id: true } },
                project: {
                    select: {
                        githubRepoFullName: true,
                        githubInstallation: { select: { installationId: true } },
                    },
                },
            },
        });
        if (!issue) return { ok: false, reason: "not_found", message: "Issue not found" };

        const role = await Access.project(actor.id, issue.projectId);
        if (!role || !Permissions.project(role, Action.project.triage_issue)) {
            return { ok: false, reason: "forbidden", message: "You cannot reopen this issue" };
        }

        if (!isReopenable(issue.status)) {
            return conflict(
                `An issue in ${ISSUE_LANE_NAME[issue.status]} cannot be reopened. Reopening works from In Review, Failed and Cancelled.`,
            );
        }

        if (issue.resolvedAt) {
            return conflict("This issue's pull request was merged, so it cannot be reopened.");
        }

        if (!(await pull_request_is_open(issue))) {
            return conflict(
                "This issue's pull request is no longer open on GitHub. Reopen it there first, then reopen the issue.",
            );
        }

        const resolved = await MessageReferenceService.resolve(note, issue.projectId);
        const note_text = to_plain_text(
            resolved.message,
            await MessageReferenceService.labels_for(resolved),
        );

        const attempt_number = (await prisma.agentSession.count({ where: { issueId: id } })) + 1;
        const previous_location = location_of(issue.status, issue.customColumn);

        const outcome = await prisma.$transaction(async (tx) => {
            const claim = await tx.issue.updateMany({
                where: { id, status: issue.status },
                data: {
                    status: IssueStatus.Todo,
                    agentDoneAt: null,
                    assignerWorkerId: null,
                    queuePosition: null,
                    sortOrder: Date.now() / 1000,
                },
            });
            if (claim.count === 0) return null;

            const activities = await ActivityService.emit(tx, {
                issueId: id,
                actor: { type: ActorType.User, userId: actor.id, name: actor.name },
                events: [
                    {
                        type: ActivityType.IssueReopened,
                        payload: {
                            note: resolved.message,
                            noteText: note_text,
                            from: previous_location,
                            attemptNumber: attempt_number,
                        },
                        dedupeKey: `reopen:${attempt_number}`,
                    },
                    {
                        type: ActivityType.StatusChanged,
                        payload: {
                            from: previous_location,
                            to: { kind: "status", status: IssueStatus.Todo },
                        },
                    },
                ],
            });

            const reopened = await tx.issue.findUniqueOrThrow({
                where: { id },
                include: ISSUE_ROW_INCLUDE,
            });

            return { reopened, activities };
        });

        if (!outcome) {
            return conflict("This issue moved while you were reopening it. Try again.");
        }

        await IssueReopenService.release_push_retry(issue.assignerWorkerId, id);

        await IssueBroadcastService.issue_updated(issue.projectId, outcome.reopened, {
            status: issue.status,
            customColumnId: issue.customColumn?.id ?? null,
        });
        await ActivityService.publish(issue.projectId, id, outcome.activities);
        await server_services.queue.enqueue_project(issue.projectId);
        await IssueReopenService.notify(actor.id, id, issue);
        await IssueReopenService.notify_mentions(actor.id, id, issue.projectId, resolved);

        return { ok: true, issue: outcome.reopened };
    }

    private static async release_push_retry(worker_id: string | null, issue_id: string) {
        if (!worker_id) return;
        const worker = await prisma.worker.findUnique({
            where: { id: worker_id },
            select: { contextSummary: true },
        });
        const summary = worker?.contextSummary as { issueId?: unknown } | null;
        if (summary?.issueId !== issue_id) return;

        await prisma.worker.update({
            where: { id: worker_id },
            data: { contextSummary: Prisma.DbNull },
        });
    }

    private static async notify_mentions(
        actor_id: string,
        issue_id: string,
        project_id: string,
        resolved: ResolvedReferences,
    ) {
        const targets = await MessageReferenceService.mention_targets({
            memberIds: resolved.memberIds,
            teamIds: resolved.teamIds,
            projectId: project_id,
            actorId: actor_id,
        });

        for (const member_id of targets.memberIds) {
            await server_services.notifications.enqueue({
                action: "issue.description_mention",
                issueId: issue_id,
                memberId: member_id,
                mentionedById: actor_id,
            });
        }
    }

    private static async notify(
        actor_id: string,
        issue_id: string,
        issue: { status: IssueStatus; createdById: string; assignees: { id: string }[] },
    ) {
        const recipients = issue_recipients({
            assigneeIds: issue.assignees.map((assignee) => assignee.id),
            creatorId: issue.createdById,
            exclude: [actor_id],
        });

        for (const recipient_id of recipients) {
            await server_services.notifications.enqueue({
                action: "issue.status_changed",
                issueId: issue_id,
                recipientId: recipient_id,
                actorId: actor_id,
                fromStatus: issue.status,
                toStatus: IssueStatus.Todo,
            });
        }
    }
}
