import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import ResponseWriter from "../../services/service.response";

export default class ConversationPreviewsGetController {
    static params_schema = z.object({
        projectId: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user?.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const parsed = ConversationPreviewsGetController.params_schema.safeParse(req.params);
            if (!parsed.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const project_role = await Access.project(user.id, parsed.data.projectId);
            if (!project_role || !Permissions.project(project_role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const [project_chat, team_chats] = await Promise.all([
                prisma.projectChat.findFirst({
                    where: { projectId: parsed.data.projectId },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        message: true,
                        isDeleted: true,
                        createdAt: true,
                        references: { include: MESSAGE_REFERENCE_INCLUDE },
                    },
                }),
                prisma.teamChat.findMany({
                    where: {
                        team: {
                            projectId: parsed.data.projectId,
                            members: { some: { userId: user.id } },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    distinct: ["teamId"],
                    select: {
                        id: true,
                        teamId: true,
                        message: true,
                        isDeleted: true,
                        createdAt: true,
                        references: { include: MESSAGE_REFERENCE_INCLUDE },
                    },
                }),
            ]);

            ResponseWriter.success(
                res,
                {
                    project: project_chat,
                    teams: team_chats.map(({ teamId, ...latestMessage }) => ({
                        teamId,
                        latestMessage,
                    })),
                },
                "Conversation previews fetched successfully",
            );
        } catch (error) {
            console.error("ConversationPreviewsGetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
