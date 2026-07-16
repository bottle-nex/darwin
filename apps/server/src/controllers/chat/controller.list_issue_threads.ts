import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";

export default class ListIssueThreadsController {
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

            const { data, success } = ListIssueThreadsController.params_schema.safeParse(
                req.params,
            );
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const role = await Access.project(user.id, data.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const issues = await prisma.issue.findMany({
                where: { projectId: data.projectId, chats: { some: { isDeleted: false } } },
                select: {
                    id: true,
                    number: true,
                    title: true,
                    chats: {
                        where: { isDeleted: false },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { message: true, createdAt: true },
                    },
                },
            });

            const threads = issues
                .map((issue) => ({
                    id: issue.id,
                    number: issue.number,
                    title: issue.title,
                    lastMessage: issue.chats[0]
                        ? { message: issue.chats[0].message, createdAt: issue.chats[0].createdAt }
                        : null,
                }))
                .sort((a, b) => {
                    const a_time = a.lastMessage?.createdAt.getTime() ?? 0;
                    const b_time = b.lastMessage?.createdAt.getTime() ?? 0;
                    return b_time - a_time;
                });

            ResponseWriter.success(res, { threads }, "Issue threads fetched successfully");
        } catch (err) {
            console.error("ListIssueThreadsController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
