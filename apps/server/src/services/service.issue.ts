import { ActivityType, ActorType, IssueStatus, Prisma, prisma } from "@trymatcha/database";
import { OutboundSocketMessageType } from "@trymatcha/types";
import { server_services } from "..";
import ActivityService from "./service.activity";

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
    created_by: { id: string; name: string };
};

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
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2002"
                ) {
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

        const channel_name = server_services.publisher.get_channel_name(input.project_id);
        await server_services.publisher.publish_message(
            channel_name,
            JSON.stringify({
                type: OutboundSocketMessageType.ISSUE_CREATED,
                projectId: input.project_id,
                payload: full_issue,
            }),
        );

        if (!input.custom_column_id || issue.status === IssueStatus.Todo) {
            await server_services.queue.enqueue_project(input.project_id);
        }

        return full_issue;
    }
}
