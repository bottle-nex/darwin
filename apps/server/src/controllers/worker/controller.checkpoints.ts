import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import { ConnectorService } from "../../services/connectors";
import PullRequestApprovalService from "../../services/connectors/service.pr-approval";
import ResponseWriter from "../../services/service.response";

const notify_schema = z.object({
    issue_id: z.string().min(1),
    text: z.string().min(1).max(2000),
});

const approval_schema = z.object({
    issue_id: z.string().min(1),
    session_id: z.string().min(1),
    pr_body: z.string().optional(),
});

export default class WorkerCheckpoints {
    static async notify(req: Request, res: Response) {
        if (!req.worker_id) return ResponseWriter.not_authorized(res);

        const parsed = notify_schema.safeParse(req.body);
        if (!parsed.success) return ResponseWriter.invalid_data(res);

        try {
            const delivered = await ConnectorService.notify_issue(
                parsed.data.issue_id,
                parsed.data.text,
            );
            return ResponseWriter.success(res, { delivered });
        } catch (error) {
            console.error("error notifying about a worker checkpoint: ", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async request_pr_approval(req: Request, res: Response) {
        if (!req.worker_id) return ResponseWriter.not_authorized(res);

        const parsed = approval_schema.safeParse(req.body);
        if (!parsed.success) return ResponseWriter.invalid_data(res);

        try {
            if (parsed.data.pr_body) {
                await prisma.issue.update({
                    where: { id: parsed.data.issue_id },
                    data: { prBody: parsed.data.pr_body },
                });
            }

            const question = await PullRequestApprovalService.request(
                parsed.data.issue_id,
                parsed.data.session_id,
            );

            if (!question) return ResponseWriter.not_found(res, "Issue not found");

            return ResponseWriter.created(res, { question_id: question.id });
        } catch (error) {
            console.error("error requesting pull request approval: ", error);
            return ResponseWriter.system_error(res);
        }
    }
}
