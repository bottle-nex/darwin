import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";

export default class ChatGetController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = ChatGetController.params_schema.safeParse(req.params);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const issue = await prisma.issue.findUnique({
                where: { id: data.id },
                select: { id: true, projectId: true },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const chats = await prisma.chat.findMany({
                where: { issueId: issue.id, isDeleted: false },
                orderBy: { createdAt: "asc" },
                include: { sender: true },
            });

            ResponseWriter.success(res, { chats }, "Comments fetched successfully");
        } catch (err) {
            console.error("ChatGetController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
