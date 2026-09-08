import {
    ActivityType,
    ActorType,
    AgentSessionStatus,
    IssueStatus,
    prisma,
} from "@trydarwin/database";
import { ActivityService, IssueBroadcastService } from "@trydarwin/services";
import type { Request, Response } from "express";
import z from "zod";

import { location_of } from "../../services/service.activity-diff";
import AgentSessionService, {
    run_cost_schema,
    run_stats_schema,
} from "../../services/service.agent-session";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    run_id: z.string().min(1),
    issue_id: z.string().min(1),
    reason: z.string().min(1).max(2000),
    stats: run_stats_schema,
    cost: run_cost_schema,
});

export default class ReportRunFailed {
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

            const existing = await AgentSessionService.resolve_for_worker(
                data.run_id,
                data.issue_id,
                worker_id,
            );
            if (!existing) {
                ResponseWriter.not_authorized(res, "Run does not belong to this worker");
                return;
            }

            const { before, session, updated_issue, activities } = await prisma.$transaction(
                async (tx) => {
                    const before = await tx.issue.findUniqueOrThrow({
                        where: { id: data.issue_id },
                        select: {
                            status: true,
                            customColumnId: true,
                            customColumn: { select: { id: true, label: true } },
                        },
                    });

                    const session = await tx.agentSession.update({
                        where: { id: data.run_id },
                        data: {
                            status: AgentSessionStatus.Failed,
                            error: data.reason,
                            stats: AgentSessionService.to_stats(data.stats),
                            cost: AgentSessionService.to_cost(data.cost),
                            endedAt: new Date(),
                        },
                    });

                    const updated_issue = await tx.issue.update({
                        where: { id: data.issue_id },
                        data: { status: IssueStatus.Failed },
                        include: { creator: true, assignees: true, tags: true },
                    });

                    const activities = await ActivityService.emit(tx, {
                        issueId: data.issue_id,
                        actor: { type: ActorType.Agent, workerId: worker_id },
                        sessionId: session.id,
                        events: [
                            {
                                type: ActivityType.AttemptFailed,
                                payload: {
                                    attemptNumber: session.attemptNumber,
                                    reason: data.reason,
                                },
                                dedupeKey: `run:${session.id}:failed`,
                            },
                            {
                                type: ActivityType.StatusChanged,
                                payload: {
                                    from: location_of(before.status, before.customColumn),
                                    to: { kind: "status", status: IssueStatus.Failed },
                                },
                                dedupeKey: `run:${session.id}:status-failed`,
                            },
                        ],
                    });

                    return { before, session, updated_issue, activities };
                },
            );

            const project_id = existing.issue.projectId;

            await IssueBroadcastService.issue_updated(project_id, updated_issue, before);
            await ActivityService.publish(project_id, data.issue_id, activities);
            await ActivityService.publish_session(project_id, session);

            console.log(`[worker:${worker_id}] run ${data.run_id} failed: ${data.reason}`);

            ResponseWriter.success(res, null, "Run failure recorded");
        } catch (error) {
            console.error("error in reporting run failed: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
