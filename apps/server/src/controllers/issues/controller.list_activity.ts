import { ActivitySurface, prisma } from "@trymatcha/database";
import { ACTIVITY_ACTOR_SELECT, ActivityService } from "@trymatcha/services";
import type { Request, Response } from "express";
import z from "zod";

import { readable_issue_project } from "../../access-control/issue-access";
import ResponseWriter from "../../services/service.response";

const DEFAULT_LIMIT = 100;

export default class IssueActivityListController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static query_schema = z.object({
        before: z.coerce.bigint().optional(),
        limit: z.coerce.number().int().min(1).max(200).optional(),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success: params_ok } =
            IssueActivityListController.params_schema.safeParse(req.params);
        const { data: query_data, success: query_ok } =
            IssueActivityListController.query_schema.safeParse(req.query);
        if (!params_ok || !query_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const project_id = await readable_issue_project(res, user.id, params_data.id);
            if (!project_id) return;

            const limit = query_data.limit ?? DEFAULT_LIMIT;

            const rows = await prisma.issueActivity.findMany({
                where: {
                    issueId: params_data.id,
                    surface: { not: ActivitySurface.Audit },
                    seq: query_data.before ? { lt: query_data.before } : undefined,
                },
                orderBy: { seq: "desc" },
                take: limit + 1,
                include: { actorUser: ACTIVITY_ACTOR_SELECT, session: true },
            });

            const has_more = rows.length > limit;
            const page = has_more ? rows.slice(0, limit) : rows;
            const oldest_row = page.at(-1);

            ResponseWriter.success(
                res,
                {
                    activities: page.reverse().map(ActivityService.to_wire),
                    nextCursor: has_more && oldest_row ? oldest_row.seq.toString() : null,
                    hasMore: has_more,
                },
                "Activity fetched",
            );
        } catch (error) {
            console.error("IssueActivityListController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
