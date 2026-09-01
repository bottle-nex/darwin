import { ActivityType, ActorType, Effort, Harness, IssueStatus, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import ActivityService from "../../services/service.activity";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    // minted by the VM, used as AgentSession.id
    run_id: z.string().min(1),
    issue_id: z.string().min(1),
    harness: z.enum(Harness),
    model: z.string().min(1),
    effort: z.enum(Effort).nullable().optional(),
    harness_version: z.string().min(1).optional(),
});

export default class ReportRunStarted {
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
                select: { id: true, projectId: true, status: true, assignerWorkerId: true },
            });
            if (!issue || issue.assignerWorkerId !== worker_id) {
                ResponseWriter.not_authorized(res, "Issue is not assigned to this worker");
                return;
            }

            const { session, activities } = await prisma.$transaction(async (tx) => {
                const previous_attempts = await tx.agentSession.count({
                    where: { issueId: data.issue_id },
                });

                const session = await tx.agentSession.upsert({
                    where: { id: data.run_id },
                    create: {
                        id: data.run_id,
                        issueId: data.issue_id,
                        workerId: worker_id,
                        attemptNumber: previous_attempts + 1,
                        harness: data.harness,
                        harnessVersion: data.harness_version,
                        model: data.model,
                        effort: data.effort,
                    },
                    update: {},
                });

                const activities = await ActivityService.emit(tx, {
                    issueId: data.issue_id,
                    actor: { type: ActorType.Agent, workerId: worker_id },
                    sessionId: session.id,
                    events: [
                        {
                            type: ActivityType.RunStarted,
                            payload: { attemptNumber: session.attemptNumber },
                            dedupeKey: `run:${session.id}:started`,
                        },
                        {
                            type: ActivityType.StatusChanged,
                            payload: {
                                from: { kind: "status", status: IssueStatus.Queued },
                                to: { kind: "status", status: IssueStatus.InProgress },
                            },
                            dedupeKey: `run:${session.id}:claimed`,
                        },
                    ],
                });

                return { session, activities };
            });

            await ActivityService.publish(issue.projectId, data.issue_id, activities);
            await ActivityService.publish_session(issue.projectId, session);

            console.log(
                `[worker:${worker_id}] run ${data.run_id} started on issue ${data.issue_id} ` +
                    `(attempt ${session.attemptNumber})`,
            );

            ResponseWriter.success(res, { run_id: session.id }, "Run recorded");
        } catch (error) {
            console.error("error in reporting run started: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
