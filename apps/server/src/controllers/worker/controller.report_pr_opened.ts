import { Request, Response } from "express";
import { z } from "zod";
import { IssueStatus, prisma } from "@trymatcha/database";
import { OutboundSocketMessageType } from "@trymatcha/types";
import ResponseWriter from "../../services/service.response";
import { server_services } from "../..";
import ProductDiffService from "../../services/service.product_diff";

const body_schema = z.object({
    issue_id: z.string().min(1),
    pr_url: z.string().min(1),
    branch: z.string().min(1),
    summary: z.string().min(1),
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
                    prUrl: true,
                    prBranch: true,
                },
            });
            if (!issue || issue.assignerWorkerId !== worker_id) {
                ResponseWriter.not_authorized(res, "Issue is not assigned to this worker");
                return;
            }
            if (issue.prBranch !== data.branch) {
                ResponseWriter.custom(
                    res,
                    false,
                    "PR_BRANCH_MISMATCH",
                    "PR branch does not match the expected issue branch",
                    409,
                );
                return;
            }
            if (issue.prUrl && issue.prUrl !== data.pr_url) {
                ResponseWriter.custom(
                    res,
                    false,
                    "PR_URL_CONFLICT",
                    "A different PR is already recorded for this issue",
                    409,
                );
                return;
            }
            if (
                issue.status !== IssueStatus.InProgress &&
                !(issue.status === IssueStatus.InReview && issue.prUrl === data.pr_url)
            ) {
                ResponseWriter.custom(
                    res,
                    false,
                    "ISSUE_NOT_COMPLETABLE",
                    "Issue is not waiting for PR completion",
                    409,
                );
                return;
            }

            console.log(
                `[worker:${worker_id}] reporting PR opened for issue ${data.issue_id} -> ${data.pr_url} ` +
                    `(branch: ${data.branch}, writing to db now)`,
            );

            const completion = await prisma.$transaction(async (transaction) => {
                const update = await transaction.issue.updateMany({
                    where: {
                        id: data.issue_id,
                        status: IssueStatus.InProgress,
                        prUrl: null,
                        prBranch: data.branch,
                    },
                    data: { status: IssueStatus.InReview, prUrl: data.pr_url },
                });
                const transitioned = update.count === 1;

                const persisted_issue = await transaction.issue.findUniqueOrThrow({
                    where: { id: data.issue_id },
                    include: { creator: true, assignees: true, tags: true },
                });
                if (
                    !transitioned &&
                    (persisted_issue.status !== IssueStatus.InReview ||
                        persisted_issue.prUrl !== data.pr_url ||
                        persisted_issue.prBranch !== data.branch)
                ) {
                    throw new Error("PR completion conflicted with the persisted issue state");
                }

                await transaction.worker.update({
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
                return { issue: persisted_issue, transitioned };
            });

            console.log(
                `[worker:${worker_id}] issue ${data.issue_id} marked InReview, PR outcome persisted`,
            );

            if (completion.transitioned) {
                const channel_name = server_services.publisher.get_channel_name(
                    completion.issue.projectId,
                );
                await server_services.publisher.publish_message(
                    channel_name,
                    JSON.stringify({
                        type: OutboundSocketMessageType.ISSUE_UPDATED,
                        projectId: completion.issue.projectId,
                        payload: completion.issue,
                    }),
                );
                console.log(
                    `[worker:${worker_id}] published ISSUE_UPDATED for issue ${data.issue_id}`,
                );
            }

            await ProductDiffService.prepare(data.issue_id);

            ResponseWriter.success(res, null, "PR outcome recorded");
        } catch (error) {
            console.error("error in reporting PR opened: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
