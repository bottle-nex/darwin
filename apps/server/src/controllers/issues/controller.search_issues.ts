import { Request, Response } from "express";
import { prisma, Prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

export default class IssueSearchController {
    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const project_id = req.params.project_id as string;
            if (!project_id) {
                ResponseWriter.not_found(res, "Project not found");
                return;
            }

            const role = await Access.project(user.id, project_id);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
            const number = Number.parseInt(query, 10);

            const matches: Prisma.IssueWhereInput[] = [
                { title: { contains: query, mode: "insensitive" } },
            ];
            if (Number.isInteger(number)) matches.push({ number });

            const issues = await prisma.issue.findMany({
                where: { projectId: project_id, ...(query && { OR: matches }) },
                select: { id: true, number: true, title: true, status: true, priority: true },
                orderBy: Number.isInteger(number)
                    ? [{ number: "asc" }]
                    : [{ updatedAt: "desc" }, { number: "desc" }],
                take: 8,
            });

            ResponseWriter.success(res, { issues }, "Issues fetched successfully");
        } catch (err) {
            console.error("IssueSearchController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
