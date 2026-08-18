import { prisma } from "@trymatcha/database";
import z from "zod";

/** What the VM reports; mirrors `AgentReport` in @trymatcha/vm. */
export const run_stats_schema = z
    .object({
        num_turns: z.number().int().min(0).optional(),
        duration_ms: z.number().min(0).optional(),
        commits: z.number().int().min(0).optional(),
        files_changed: z.number().int().min(0).optional(),
    })
    .optional();

export const run_cost_schema = z
    .object({
        total_cost_usd: z.number().min(0).optional(),
        sandbox_seconds: z.number().min(0).optional(),
    })
    .optional();

export default class AgentSessionService {
    /**
     * Both checks are load-bearing: the issue check stops a worker reporting on
     * an issue it no longer holds, the session check stops a worker that has since
     * been handed a reassigned issue from settling the previous worker's run.
     */
    static async resolve_for_worker(run_id: string, issue_id: string, worker_id: string) {
        return prisma.agentSession.findFirst({
            where: { id: run_id, issueId: issue_id, workerId: worker_id },
            select: { id: true, attemptNumber: true, issue: { select: { projectId: true } } },
        });
    }

    static to_stats(stats: z.infer<typeof run_stats_schema>) {
        if (!stats) return undefined;
        return {
            numTurns: stats.num_turns,
            durationMs: stats.duration_ms,
            commits: stats.commits,
            filesChanged: stats.files_changed,
        };
    }

    static to_cost(cost: z.infer<typeof run_cost_schema>) {
        if (!cost) return undefined;
        return {
            totalCostUsd: cost.total_cost_usd,
            sandboxSeconds: cost.sandbox_seconds,
        };
    }
}
