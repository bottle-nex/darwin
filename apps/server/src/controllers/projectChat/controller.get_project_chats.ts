import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";

export default class ProjectChatGetController {
    static params_schema = z.object({
        projectId: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = ProjectChatGetController.params_schema.safeParse(req.params);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const role = await Access.project(user.id, data.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const chats = await prisma.projectChat.findMany({
                where: { projectId: data.projectId },
                orderBy: { createdAt: "asc" },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                    mentions: { include: { member: { include: { user: true } } } },
                },
            });

            ResponseWriter.success(res, { chats }, "Project chats fetched successfully");
        } catch (err) {
            console.error("ProjectChatGetController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
