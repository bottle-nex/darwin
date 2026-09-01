import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    id: z.string().min(1),
});

/**
 * Every run's account of how it solved this issue, oldest first.
 *
 * Read here rather than off the activity feed's sessions: that feed is paginated, so an issue
 * with enough history would quietly drop its earliest run's report off the end of the list.
 */
export default class SolveReportListController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params, success } = params_schema.safeParse(req.params);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const issue = await prisma.issue.findUnique({
                where: { id: params.id },
                select: { projectId: true },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            const sessions = await prisma.agentSession.findMany({
                where: { issueId: params.id, report: { not: null } },
                orderBy: { attemptNumber: "asc" },
                select: {
                    id: true,
                    attemptNumber: true,
                    model: true,
                    report: true,
                    startedAt: true,
                    endedAt: true,
                },
            });

            ResponseWriter.success(res, { reports: sessions }, "Solve reports fetched");
        } catch (error) {
            console.error("SolveReportListController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
