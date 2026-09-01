import { ActivityType, ActorType, AgentSessionStatus, prisma } from "@trymatcha/database";
import { ActivityService } from "@trymatcha/services";
import type { Request, Response } from "express";
import z from "zod";

import AgentSessionService, {
    run_cost_schema,
    run_stats_schema,
} from "../../services/service.agent-session";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    run_id: z.string().min(1),
    issue_id: z.string().min(1),
    summary: z.string().max(500).optional(),
    stats: run_stats_schema,
    cost: run_cost_schema,
});

export default class ReportRunCompleted {
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

            const { session, activities } = await prisma.$transaction(async (tx) => {
                const session = await tx.agentSession.update({
                    where: { id: data.run_id },
                    data: {
                        status: AgentSessionStatus.Succeeded,
                        summary: data.summary,
                        stats: AgentSessionService.to_stats(data.stats),
                        cost: AgentSessionService.to_cost(data.cost),
                        endedAt: new Date(),
                    },
                });

                const activities = await ActivityService.emit(tx, {
                    issueId: data.issue_id,
                    actor: { type: ActorType.Agent, workerId: worker_id },
                    sessionId: session.id,
                    events: [
                        {
                            type: ActivityType.RunCompleted,
                            payload: {
                                attemptNumber: session.attemptNumber,
                                summary: data.summary,
                            },
                            dedupeKey: `run:${session.id}:completed`,
                        },
                    ],
                });

                return { session, activities };
            });

            const project_id = existing.issue.projectId;

            await ActivityService.publish(project_id, data.issue_id, activities);
            await ActivityService.publish_session(project_id, session);

            console.log(`[worker:${worker_id}] run ${data.run_id} completed`);

            ResponseWriter.success(res, null, "Run completion recorded");
        } catch (error) {
            console.error("error in reporting run completed: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
