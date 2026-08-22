import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import IssueService, { BULK_ISSUE_LIMIT } from "../../services/service.issue";
import { prisma } from "@trymatcha/database";
import BoardIssueService, {
    BOARD_ISSUE_SELECT,
    type BoardIssueRow,
    type IssueLane,
} from "../../services/service.board-issues";

export default class IssueBulkDeleteController {
    static body_schema = z.object({
        issue_ids: z.array(z.string().min(1)).min(1).max(BULK_ISSUE_LIMIT),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = IssueBulkDeleteController.body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const deleted: string[] = [];
            const changes: {
                issue: BoardIssueRow;
                beforeLane: IssueLane;
            }[] = [];
            const failed: string[] = [];
            const issues = await prisma.issue.findMany({
                where: { id: { in: data.issue_ids } },
                select: BOARD_ISSUE_SELECT,
            });
            const issues_by_id = new Map(issues.map((issue) => [issue.id, issue]));

            for (const id of data.issue_ids) {
                const issue = issues_by_id.get(id);
                const result = await IssueService.delete_issue(user, id);
                if (result.ok && issue) {
                    deleted.push(id);
                    changes.push({
                        issue,
                        beforeLane: BoardIssueService.issue_lane(issue),
                    });
                } else failed.push(id);
            }

            if (!deleted.length) {
                ResponseWriter.not_authorized(res, "None of those issues could be deleted");
                return;
            }

            ResponseWriter.success(
                res,
                { deleted, failed, changes },
                `Deleted ${deleted.length} ${deleted.length === 1 ? "issue" : "issues"}`,
            );
        } catch (error) {
            console.error("IssueBulkDeleteController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
