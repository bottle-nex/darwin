import { IssueStatus, WorkerStatus, prisma } from "@trymatcha/database";
import { guard_services } from "..";

export const STUCK_CLAIM_MS = 60_000;
export const RECONCILE_INTERVAL_MS = 30_000;
export const ORPHAN_TODO_MS = 30_000;
export const STUCK_DISPATCH_MS = 2 * 60_000;

export default class Reconciler {
    static async sweep_stuck_routed_claims() {
        try {
            const cut_off = new Date(Date.now() - STUCK_CLAIM_MS);
            const projects = await prisma.project.findMany({
                where: {
                    routingClaimedAt: {
                        lt: cut_off,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (projects.length === 0) {
                console.log("[reconciler] sweep_stuck_routed_claims: nothing stuck");
                return;
            }

            console.log(
                `[reconciler] sweep_stuck_routed_claims: found ${projects.length} stuck project(s) ` +
                    `(claimed >${STUCK_CLAIM_MS}ms ago), clearing claim and re-enqueueing`,
            );
            for (const p of projects) {
                await prisma.project.update({
                    where: {
                        id: p.id,
                    },
                    data: {
                        routingClaimedAt: null,
                    },
                });
                await guard_services.queue.enqueue_project(p.id);
            }
        } catch (err) {
            console.error("[reconciler] error while sweeping stuck projects: ", err);
        }
    }

    static async sweep_orphan_issues() {
        try {
            const cut_off = new Date(Date.now() - ORPHAN_TODO_MS);
            const issues = await prisma.issue.findMany({
                where: {
                    status: IssueStatus.Todo,
                    createdAt: {
                        lt: cut_off,
                    },
                },
                select: {
                    projectId: true,
                },
            });
            const project_ids = new Set(issues.map((i) => i.projectId));

            if (project_ids.size === 0) {
                console.log("[reconciler] sweep_orphan_issues: nothing orphaned");
                return;
            }

            console.log(
                `[reconciler] sweep_orphan_issues: found ${issues.length} orphaned Todo issue(s) ` +
                    `across ${project_ids.size} project(s), re-enqueueing: ${[...project_ids].join(", ")}`,
            );
            for (const projectId of project_ids) {
                await guard_services.queue.enqueue_project(projectId);
            }
        } catch (err) {
            console.error("[reconciler] error while sweeping orphan issues: ", err);
        }
    }

    /**
     * A Queued issue's assignerWorkerId should always have a live dispatch job driving
     * it — but the dispatch enqueue happens right after the routing transaction commits,
     * as a separate step, so it can fail (or silently no-op, as the dispatch:worker_id
     * jobId bug did) without the issue's Queued status ever rolling back. This sweep finds
     * Queued issues sitting stale with no active/waiting dispatch job behind them and
     * re-dispatches their worker. Dead workers are skipped on purpose — Dead is a
     * deliberate terminal state (see run_worker_loop's catch), and auto-reviving it here
     * would silently retry a possibly-permanent failure forever instead of surfacing it.
     */
    static async sweep_stuck_dispatches() {
        try {
            const cut_off = new Date(Date.now() - STUCK_DISPATCH_MS);
            const issues = await prisma.issue.findMany({
                where: {
                    status: IssueStatus.Queued,
                    assignerWorkerId: { not: null },
                    updatedAt: { lt: cut_off },
                },
                select: {
                    assignerWorkerId: true,
                    assignedWorker: { select: { status: true } },
                },
            });

            if (issues.length === 0) {
                console.log("[reconciler] sweep_stuck_dispatches: nothing stuck");
                return;
            }

            const worker_ids = new Map(
                issues.map((i) => [i.assignerWorkerId!, i.assignedWorker?.status]),
            );
            console.log(
                `[reconciler] sweep_stuck_dispatches: ${issues.length} Queued issue(s) stale ` +
                    `>${STUCK_DISPATCH_MS}ms across ${worker_ids.size} worker(s), checking dispatch state`,
            );

            let redispatched = 0;
            let skipped_dead = 0;
            for (const [worker_id, status] of worker_ids) {
                if (status === WorkerStatus.Dead) {
                    console.log(
                        `[reconciler] sweep_stuck_dispatches: worker ${worker_id} is Dead with ` +
                            `Queued issue(s) stuck behind it — needs manual triage, not auto-retrying`,
                    );
                    skipped_dead++;
                    continue;
                }

                const has_job = await guard_services.queue.has_active_dispatch(worker_id);
                if (has_job) continue;

                console.log(
                    `[reconciler] sweep_stuck_dispatches: worker ${worker_id} (status ${status}) has ` +
                        `stuck Queued issue(s) but no active dispatch job — re-dispatching`,
                );
                await guard_services.queue.enqueue_dispatch(worker_id);
                redispatched++;
            }

            console.log(
                `[reconciler] sweep_stuck_dispatches: re-dispatched ${redispatched}, skipped ${skipped_dead} dead`,
            );
        } catch (err) {
            console.error("[reconciler] error while sweeping stuck dispatches: ", err);
        }
    }

    static async start_sweeper() {
        console.log(
            "[reconciler] sweep starting (stuck routed claims + orphan todo issues + stuck dispatches)",
        );
        await Reconciler.sweep_stuck_routed_claims();
        await Reconciler.sweep_orphan_issues();
        await Reconciler.sweep_stuck_dispatches();
        console.log("[reconciler] sweep complete");
    }
}
