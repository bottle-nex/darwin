import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import BoardIssueService, {
    type BoardIssueRow,
    type IssueLane,
} from "../../services/service.board-issues";
import IssueService, { BULK_ISSUE_LIMIT, ISSUE_PATCH_SCHEMA } from "../../services/service.issue";
import ResponseWriter from "../../services/service.response";

export default class IssueBulkUpdateController {
    static body_schema = ISSUE_PATCH_SCHEMA.omit({ tag_ids: true, assignee_ids: true }).extend({
        issue_ids: z.array(z.string().min(1)).min(1).max(BULK_ISSUE_LIMIT),
        add_tag_ids: z.array(z.string()).max(20).optional(),
        remove_tag_ids: z.array(z.string()).max(20).optional(),
        add_assignee_ids: z.array(z.string()).max(20).optional(),
        remove_assignee_ids: z.array(z.string()).max(20).optional(),
    });

    private static merge(current: string[], add?: string[], remove?: string[]) {
        if (!add?.length && !remove?.length) return undefined;
        const next = new Set(current);
        for (const id of add ?? []) next.add(id);
        for (const id of remove ?? []) next.delete(id);
        return [...next];
    }

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = IssueBulkUpdateController.body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const {
            issue_ids,
            add_tag_ids,
            remove_tag_ids,
            add_assignee_ids,
            remove_assignee_ids,
            ...patch
        } = data;

        try {
            const updated: string[] = [];
            const changes: {
                issue: BoardIssueRow;
                beforeLane: IssueLane;
                afterLane: IssueLane;
            }[] = [];
            const failed: string[] = [];

            const memberships = await prisma.issue.findMany({
                where: { id: { in: issue_ids } },
                select: {
                    id: true,
                    status: true,
                    customColumnId: true,
                    tags: { select: { id: true } },
                    assignees: { select: { id: true } },
                },
            });
            const memberships_by_id = new Map(
                memberships.map((membership) => [membership.id, membership]),
            );

            for (const id of issue_ids) {
                const current = memberships_by_id.get(id);
                if (!current) {
                    failed.push(id);
                    continue;
                }

                const result = await IssueService.update_issue(user, id, {
                    ...patch,
                    tag_ids: IssueBulkUpdateController.merge(
                        current.tags.map((tag) => tag.id),
                        add_tag_ids,
                        remove_tag_ids,
                    ),
                    assignee_ids: IssueBulkUpdateController.merge(
                        current.assignees.map((assignee) => assignee.id),
                        add_assignee_ids,
                        remove_assignee_ids,
                    ),
                });
                if (result.ok) {
                    updated.push(id);
                    changes.push({
                        issue: result.issue,
                        beforeLane: BoardIssueService.issue_lane(current),
                        afterLane: BoardIssueService.issue_lane(result.issue),
                    });
                } else failed.push(id);
            }

            if (!updated.length) {
                ResponseWriter.not_authorized(res, "None of those issues could be updated");
                return;
            }

            ResponseWriter.success(
                res,
                { updated, failed, changes },
                `Updated ${updated.length} ${updated.length === 1 ? "issue" : "issues"}`,
            );
        } catch (error) {
            console.error("IssueBulkUpdateController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
