import { Request, Response } from "express";
import { z } from "zod";
import { ActivityType, ActorType, IssueStatus, prisma } from "@trymatcha/database";
import { OutboundSocketMessageType } from "@trymatcha/types";
import ResponseWriter from "../../services/service.response";
import { server_services } from "../..";
import ActivityService from "../../services/service.activity";
import { location_of } from "../../services/service.activity-diff";
import ProductDiffService from "../../services/service.product_diff";

const body_schema = z.object({
    issue_id: z.string().min(1),
    pr_url: z.string().min(1),
    branch: z.string().min(1),
    summary: z.string().min(1),
    run_id: z.string().min(1).optional(),
});

export default class ReportPrOpened {
    static async process(req: Request, res: Response) {
        try {
            const worker_id = req.worker_id;
            if (!worker_id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = body_schema.safeParse(req.body);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const issue = await prisma.issue.findUnique({
                where: { id: data.issue_id },
                select: {
                    id: true,
                    assignerWorkerId: true,
                    status: true,
                    customColumn: { select: { id: true, label: true } },
                },
            });
            if (!issue || issue.assignerWorkerId !== worker_id) {
                ResponseWriter.not_authorized(res, "Issue is not assigned to this worker");
                return;
            }

            console.log(
                `[worker:${worker_id}] reporting PR opened for issue ${data.issue_id} -> ${data.pr_url} ` +
                    `(branch: ${data.branch}, writing to db now)`,
            );

            // A reassigned issue must not let this worker attach rows to another
            // worker's session, so the run has to match both the issue and the worker.
            const session = data.run_id
                ? await prisma.agentSession.findFirst({
                      where: { id: data.run_id, issueId: data.issue_id, workerId: worker_id },
                      select: { id: true },
                  })
                : null;

            const { updated_issue, activities } = await prisma.$transaction(async (tx) => {
                const updated_issue = await tx.issue.update({
                    where: { id: data.issue_id },
                    data: { status: IssueStatus.InReview, prUrl: data.pr_url },
                    include: { creator: true, assignees: true, tags: true },
                });

                await tx.worker.update({
                    where: { id: worker_id },
                    data: {
                        contextSummary: {
                            lastIssueId: data.issue_id,
                            lastPrUrl: data.pr_url,
                            lastBranch: data.branch,
                            lastSummary: data.summary,
                            reportedAt: new Date().toISOString(),
                        },
                    },
                });

                const activities = await ActivityService.emit(tx, {
                    issueId: data.issue_id,
                    actor: { type: ActorType.Agent, workerId: worker_id },
                    sessionId: session?.id,
                    events: [
                        {
                            type: ActivityType.PrOpened,
                            payload: { url: data.pr_url },
                            dedupeKey: `pr:${data.pr_url}`,
                        },
                        {
                            type: ActivityType.StatusChanged,
                            payload: {
                                from: location_of(issue.status, issue.customColumn),
                                to: { kind: "status", status: IssueStatus.InReview },
                            },
                        },
                    ],
                });

                return { updated_issue, activities };
            });

            console.log(
                `[worker:${worker_id}] issue ${data.issue_id} marked InReview, PR outcome persisted`,
            );

            const channel_name = server_services.publisher.get_channel_name(
                updated_issue.projectId,
            );
            await server_services.publisher.publish_message(
                channel_name,
                JSON.stringify({
                    type: OutboundSocketMessageType.ISSUE_UPDATED,
                    projectId: updated_issue.projectId,
                    payload: updated_issue,
                }),
            );
            console.log(`[worker:${worker_id}] published ISSUE_UPDATED for issue ${data.issue_id}`);

            await ActivityService.publish(updated_issue.projectId, data.issue_id, activities);

            try {
                await ProductDiffService.prepare(data.issue_id);
            } catch (error) {
                console.error("product diff preparation failed", error);
            }

            ResponseWriter.success(res, null, "PR outcome recorded");
        } catch (error) {
            console.error("error in reporting PR opened: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
