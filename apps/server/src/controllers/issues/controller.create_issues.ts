import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { Prisma, prisma } from "@trymatcha/database";
import { server_services } from "../..";
import { OutboundSocketMessageType } from "@trymatcha/types";

export default class IssueCreateController {
    static body_schema = z.object({
        project_id: z.string().min(1),
        title: z.string().min(1).max(200),
        description: z.string(),
        priority: z.number().int().min(1).max(4).optional(),
        label: z.string().optional(),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }
            const parsed_body = IssueCreateController.body_schema.safeParse(req.body);
            if (!parsed_body.success) {
                ResponseWriter.invalid_data(res, "Invalid issue data provided");
                return;
            }

            const role = await Access.project(user.id, parsed_body.data.project_id);
            if (!role || !Permissions.project(role, Action.project.create_issue)) {
                ResponseWriter.not_authorized(
                    res,
                    "You dont have permissions to create issues in this project",
                );
                return;
            }

            let issue: { id: string } | undefined;
            for (let attempt = 0; attempt < 5; attempt++) {
                try {
                    issue = await prisma.$transaction(async (tx) => {
                        const last_issue = await tx.issue.findFirst({
                            where: { projectId: parsed_body.data.project_id },
                            orderBy: { number: "desc" },
                            select: { number: true },
                        });

                        return tx.issue.create({
                            data: {
                                title: parsed_body.data.title,
                                description: parsed_body.data.description,
                                priority: parsed_body.data.priority ?? 3,
                                label: parsed_body.data.label,
                                projectId: parsed_body.data.project_id,
                                createdById: user.id,
                                number: (last_issue?.number ?? 0) + 1,
                            },
                            select: { id: true },
                        });
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
                ResponseWriter.system_error(res);
                return;
            }
            const channel_name = server_services.publisher.get_channel_name(
                parsed_body.data.project_id,
            );
            const publishing_body = { type: OutboundSocketMessageType.ISSUE_CREATED, data: { issue_id: issue.id, }, }
            await server_services.publisher.publish_message(channel_name, JSON.stringify(publishing_body))

            ResponseWriter.created(res, { issue_id: issue.id }, "Issue created successfully");
        } catch (err) {
            ResponseWriter.system_error(res);
        }
    }
}
