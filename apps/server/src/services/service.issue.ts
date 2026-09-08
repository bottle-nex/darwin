import { Action, Permissions } from "@trydarwin/access-control";
import type { ExecutionMode } from "@trydarwin/database";
import { ActivityType, ActorType, Harness, IssueStatus, Prisma, prisma } from "@trydarwin/database";
import { Registry } from "@trydarwin/harness";
import { ActivityService, IssueBroadcastService } from "@trydarwin/services";
import { canMoveIssue, hasHumanMove, isReopenable, ISSUE_LANE_NAME } from "@trydarwin/types";
import z from "zod";

import { server_services } from "..";
import Access from "../access-control/access";
import { issue_recipients } from "../notifications/recipients";
import { diff_issue } from "./service.activity-diff";
import DescriptionReferenceService from "./service.description-references";

export type CreateIssueInput = {
    project_id: string;
    title: string;
    description: string;
    priority?: number;
    custom_column_id?: string;
    start_date?: Date;
    target_date?: Date;
    assignee_ids?: string[];
    tag_ids?: string[];
    execution_mode?: ExecutionMode;
    created_by: { id: string; name: string };
    github_link?: {
        githubIssueId: string;
        number: number;
        url: string;
        authorLogin: string;
        authorAvatar: string | null;
    };
};

export const BULK_ISSUE_LIMIT = 100;

export const ISSUE_PATCH_SCHEMA = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    priority: z.number().int().min(0).max(4).optional(),
    status: z.enum(IssueStatus).optional(),
    custom_column_id: z.string().nullable().optional(),
    tag_ids: z.array(z.string()).max(20).optional(),
    assignee_ids: z.array(z.string()).max(20).optional(),
    start_date: z.union([z.null(), z.coerce.date()]).optional(),
    target_date: z.union([z.null(), z.coerce.date()]).optional(),
    sort_order: z.number().finite().optional(),
});

export type IssuePatch = z.infer<typeof ISSUE_PATCH_SCHEMA>;

export type IssueActor = { id: string; name?: string | null };

export type IssueMutationFailure = {
    ok: false;
    reason: "not_found" | "forbidden" | "invalid";
    message?: string;
};

export const ISSUE_ROW_INCLUDE = {
    creator: true,
    assignees: true,
    tags: true,
    customColumn: { select: { id: true, label: true } },
} satisfies Prisma.IssueInclude;

export type IssueRow = Prisma.IssueGetPayload<{ include: typeof ISSUE_ROW_INCLUDE }>;

export type UpdateIssueResult = { ok: true; issue: IssueRow } | IssueMutationFailure;

export type DeleteIssueResult = { ok: true } | IssueMutationFailure;

function is_issue_number_collision(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        return false;
    }
    const target = error.meta?.target;
    const fields = Array.isArray(target) ? target : [target];
    return fields.includes("number") || fields.includes("Issue_projectId_number_key");
}

function resolve_next_status(
    current: IssueStatus,
    requested: IssueStatus | undefined,
    next_column_id: string | null,
): IssueStatus {
    if (next_column_id !== null) return IssueStatus.Parked;
    if (requested && requested !== IssueStatus.Parked) return requested;
    if (current === IssueStatus.Parked) return IssueStatus.Todo;
    return current;
}

function move_refusal(from: IssueStatus, to: IssueStatus): string {
    if (to === IssueStatus.Todo && isReopenable(from)) {
        return "Reopen this issue instead. Reopening asks for a note saying what to change, which is what tells the agent to do something different this time.";
    }
    if (!hasHumanMove(from)) {
        return `The agent is working this issue. Wait for it to leave ${ISSUE_LANE_NAME[from]}.`;
    }
    return `An issue cannot be moved from ${ISSUE_LANE_NAME[from]} to ${ISSUE_LANE_NAME[to]}.`;
}

function update_issue_row(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.IssueUpdateInput,
): Promise<IssueRow> {
    return tx.issue.update({ where: { id }, data, include: ISSUE_ROW_INCLUDE });
}

export default class IssueService {
    static async create_issue(input: CreateIssueInput) {
        let issue: { id: string; status: IssueStatus } | undefined;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                issue = await prisma.$transaction(async (tx) => {
                    const last_issue = await tx.issue.findFirst({
                        where: { projectId: input.project_id },
                        orderBy: { number: "desc" },
                        select: { number: true },
                    });

                    const created = await tx.issue.create({
                        data: {
                            title: input.title,
                            description: input.description,
                            priority: input.priority ?? 3,
                            startDate: input.start_date,
                            targetDate: input.target_date,
                            projectId: input.project_id,
                            createdById: input.created_by.id,
                            customColumnId: input.custom_column_id,
                            sortOrder: Date.now() / 1000,
                            status: input.custom_column_id ? IssueStatus.Parked : IssueStatus.Todo,
                            number: (last_issue?.number ?? 0) + 1,
                            assignees: input.assignee_ids?.length
                                ? { connect: input.assignee_ids.map((id) => ({ id })) }
                                : undefined,
                            tags: input.tag_ids?.length
                                ? { connect: input.tag_ids.map((id) => ({ id })) }
                                : undefined,
                        },
                        select: { id: true, status: true },
                    });

                    if (input.execution_mode) {
                        const project_config = await tx.projectConfig.findUnique({
                            where: { projectId: input.project_id },
                            select: { harness: true, defaultModel: true },
                        });
                        const harness = project_config?.harness ?? Harness.Claude;
                        const model =
                            project_config?.defaultModel ?? Registry.get(harness).models[0];
                        await tx.issueConfig.create({
                            data: {
                                issueId: created.id,
                                harness,
                                model,
                                executionMode: input.execution_mode,
                            },
                        });
                    }

                    if (input.github_link) {
                        await tx.githubIssueLink.create({
                            data: {
                                issueId: created.id,
                                projectId: input.project_id,
                                githubIssueId: BigInt(input.github_link.githubIssueId),
                                number: input.github_link.number,
                                url: input.github_link.url,
                                authorLogin: input.github_link.authorLogin,
                                authorAvatar: input.github_link.authorAvatar,
                            },
                        });
                    }

                    await ActivityService.emit(tx, {
                        issueId: created.id,
                        actor: {
                            type: ActorType.User,
                            userId: input.created_by.id,
                            name: input.created_by.name,
                        },
                        events: [{ type: ActivityType.IssueCreated, dedupeKey: "issue:created" }],
                    });

                    return created;
                });
                break;
            } catch (error) {
                if (is_issue_number_collision(error)) {
                    continue;
                }
                throw error;
            }
        }

        if (!issue) {
            return null;
        }

        const full_issue = await prisma.issue.findUniqueOrThrow({
            where: { id: issue.id },
            include: { creator: true, assignees: true, tags: true },
        });

        await IssueBroadcastService.issue_created(input.project_id, full_issue);

        if (!input.custom_column_id || issue.status === IssueStatus.Todo) {
            await server_services.queue.enqueue_project(input.project_id);
        }

        return full_issue;
    }

    static async update_issue(
        actor: IssueActor,
        id: string,
        patch: IssuePatch,
    ): Promise<UpdateIssueResult> {
        const issue = await prisma.issue.findUnique({
            where: { id },
            select: {
                projectId: true,
                status: true,
                priority: true,
                title: true,
                description: true,
                startDate: true,
                targetDate: true,
                customColumnId: true,
                customColumn: { select: { id: true, label: true } },
                createdById: true,
                assignees: { select: { id: true, name: true, image: true } },
                tags: { select: { id: true, name: true, color: true } },
            },
        });
        if (!issue) return { ok: false, reason: "not_found" };

        const role = await Access.project(actor.id, issue.projectId);
        if (!role || !Permissions.project(role, Action.project.triage_issue)) {
            return { ok: false, reason: "forbidden" };
        }

        if (patch.custom_column_id) {
            const column = await prisma.customColumn.findFirst({
                where: { id: patch.custom_column_id, space: { projectId: issue.projectId } },
                select: { id: true },
            });
            if (!column) {
                return {
                    ok: false,
                    reason: "invalid",
                    message: "Column not found in this project",
                };
            }
        }

        if (patch.tag_ids?.length) {
            const tag_count = await prisma.tag.count({
                where: { id: { in: patch.tag_ids }, projectId: issue.projectId },
            });
            if (tag_count !== patch.tag_ids.length) {
                return {
                    ok: false,
                    reason: "invalid",
                    message: "One or more tags are not in this project",
                };
            }
        }

        if (patch.assignee_ids?.length) {
            const assignee_roles = await Promise.all(
                patch.assignee_ids.map((assignee_id) =>
                    Access.project(assignee_id, issue.projectId),
                ),
            );
            if (assignee_roles.some((assignee_role) => !assignee_role)) {
                return {
                    ok: false,
                    reason: "invalid",
                    message: "One or more assignees are not project members",
                };
            }
        }

        const next_start_date = patch.start_date !== undefined ? patch.start_date : issue.startDate;
        const next_target_date =
            patch.target_date !== undefined ? patch.target_date : issue.targetDate;
        if (next_start_date && next_target_date && next_start_date > next_target_date) {
            return {
                ok: false,
                reason: "invalid",
                message: "Start date must be on or before the end date",
            };
        }

        const next_column_id =
            patch.custom_column_id !== undefined ? patch.custom_column_id : issue.customColumnId;

        const next_status = resolve_next_status(issue.status, patch.status, next_column_id);
        if (!canMoveIssue(issue.status, next_status)) {
            return {
                ok: false,
                reason: "invalid",
                message: move_refusal(issue.status, next_status),
            };
        }

        const references =
            patch.description !== undefined
                ? await DescriptionReferenceService.resolve(patch.description, issue.projectId)
                : null;

        const { updated, activities } = await prisma.$transaction(async (tx) => {
            const updated = await update_issue_row(tx, id, {
                title: patch.title,
                description: references ? references.message : undefined,
                priority: patch.priority,
                sortOrder: patch.sort_order,
                status: next_status,
                customColumn:
                    next_column_id === null
                        ? { disconnect: true }
                        : { connect: { id: next_column_id } },
                startDate: patch.start_date,
                targetDate: patch.target_date,
                tags: patch.tag_ids
                    ? { set: patch.tag_ids.map((tag_id) => ({ id: tag_id })) }
                    : undefined,
                assignees: patch.assignee_ids
                    ? { set: patch.assignee_ids.map((user_id) => ({ id: user_id })) }
                    : undefined,
            });

            const activities = await ActivityService.emit(tx, {
                issueId: id,
                actor: { type: ActorType.User, userId: actor.id, name: actor.name },
                events: diff_issue(issue, updated),
            });

            return { updated, activities };
        });

        if (references) {
            await DescriptionReferenceService.write({
                issueId: id,
                projectId: issue.projectId,
                actorId: actor.id,
                resolved: references,
            });
        }

        await IssueBroadcastService.issue_updated(issue.projectId, updated, issue);
        await ActivityService.publish(issue.projectId, id, activities);
        await IssueService.notify_update(actor.id, issue, updated, next_status, next_column_id);

        return { ok: true, issue: updated };
    }

    static async delete_issue(actor: IssueActor, id: string): Promise<DeleteIssueResult> {
        const issue = await prisma.issue.findUnique({
            where: { id },
            select: {
                projectId: true,
                number: true,
                title: true,
                assignees: { select: { id: true } },
                project: { select: { slug: true, organization: { select: { slug: true } } } },
            },
        });
        if (!issue) return { ok: false, reason: "not_found" };

        const role = await Access.project(actor.id, issue.projectId);
        if (!role || !Permissions.project(role, Action.project.close_issue)) {
            return { ok: false, reason: "forbidden" };
        }

        await prisma.issue.delete({ where: { id } });

        for (const assignee of issue.assignees) {
            if (assignee.id === actor.id) continue;
            await server_services.notifications.enqueue({
                action: "issue.deleted",
                issueId: id,
                recipientId: assignee.id,
                actorId: actor.id,
                issueNumber: issue.number,
                issueTitle: issue.title,
                projectId: issue.projectId,
                projectSlug: issue.project.slug,
                orgSlug: issue.project.organization.slug,
            });
        }

        return { ok: true };
    }

    private static async notify_update(
        actor_id: string,
        before: {
            status: IssueStatus;
            priority: number;
            customColumnId: string | null;
            createdById: string;
            assignees: { id: string }[];
        },
        after: { id: string; priority: number; assignees: { id: string }[] },
        next_status: IssueStatus,
        next_column_id: string | null,
    ) {
        const before_assignees = new Set(before.assignees.map((assignee) => assignee.id));
        const after_assignees = new Set(after.assignees.map((assignee) => assignee.id));

        for (const assignee_id of after_assignees) {
            if (assignee_id === actor_id || before_assignees.has(assignee_id)) continue;
            await server_services.notifications.enqueue({
                action: "issue.assigned",
                issueId: after.id,
                assigneeId: assignee_id,
                actorId: actor_id,
            });
        }

        for (const assignee_id of before_assignees) {
            if (assignee_id === actor_id || after_assignees.has(assignee_id)) continue;
            await server_services.notifications.enqueue({
                action: "issue.unassigned",
                issueId: after.id,
                assigneeId: assignee_id,
                actorId: actor_id,
            });
        }

        const recipients = issue_recipients({
            assigneeIds: [...after_assignees],
            creatorId: before.createdById,
            exclude: [actor_id],
        });

        const column_changed = next_column_id !== before.customColumnId;

        if (column_changed) {
            for (const recipient_id of recipients) {
                await server_services.notifications.enqueue({
                    action: "issue.moved",
                    issueId: after.id,
                    recipientId: recipient_id,
                    actorId: actor_id,
                    toColumnId: next_column_id,
                });
            }
        } else if (next_status !== before.status) {
            for (const recipient_id of recipients) {
                await server_services.notifications.enqueue({
                    action: "issue.status_changed",
                    issueId: after.id,
                    recipientId: recipient_id,
                    actorId: actor_id,
                    fromStatus: before.status,
                    toStatus: next_status,
                });
            }
        }

        if (after.priority === 1 && before.priority !== 1) {
            for (const assignee_id of after_assignees) {
                if (assignee_id === actor_id) continue;
                await server_services.notifications.enqueue({
                    action: "issue.priority_changed",
                    issueId: after.id,
                    recipientId: assignee_id,
                    actorId: actor_id,
                    priority: after.priority,
                });
            }
        }
    }
}
