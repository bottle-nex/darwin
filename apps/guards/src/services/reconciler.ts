import Logger from "@trymatcha/logger";
import { IssueStatus, WorkerStatus, prisma } from "@trymatcha/database";
import { guard_services } from "..";

const log = Logger.scope("reconciler");

export const STUCK_CLAIM_MS = 60_000;
export const RECONCILE_INTERVAL_MS = 30_000;
export const ORPHAN_TODO_MS = 30_000;
export const STUCK_DISPATCH_MS = 2 * 60_000;
export const RECONCILE_AFTER_MS = 60_000;

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

            if (projects.length === 0) return;

            log.info("clearing stuck routing claim(s)", {
                count: projects.length,
                projects: projects.map((p) => p.id).join(", "),
            });
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
            log.error("sweep failed: stuck routing claims", err);
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

            if (project_ids.size === 0) return;

            log.info("re-enqueueing orphan Todo issue(s)", {
                issues: issues.length,
                projects: [...project_ids].join(", "),
            });
            for (const projectId of project_ids) {
                await guard_services.queue.enqueue_project(projectId);
            }
        } catch (err) {
            log.error("sweep failed: orphan issues", err);
        }
    }

    static async sweep_stuck_dispatches() {
        try {
            const cut_off = new Date(Date.now() - STUCK_DISPATCH_MS);
            const issues = await prisma.issue.findMany({
                where: {
                    status: { in: [IssueStatus.Queued, IssueStatus.InProgress] },
                    assignerWorkerId: { not: null },
                    updatedAt: { lt: cut_off },
                },
                select: {
                    assignerWorkerId: true,
                    assignedWorker: { select: { status: true } },
                },
            });

            if (issues.length === 0) return;

            const worker_ids = new Map(
                issues.map((i) => [i.assignerWorkerId!, i.assignedWorker?.status]),
            );

            for (const [worker_id, status] of worker_ids) {
                if (status === WorkerStatus.Dead) continue;

                const has_job = await guard_services.queue.has_active_dispatch(worker_id);
                if (has_job) continue;

                log.info("re-dispatching worker with no active dispatch job", {
                    worker: worker_id,
                    status,
                });
                await guard_services.queue.enqueue_dispatch(worker_id);
            }
        } catch (err) {
            log.error("sweep failed: stuck dispatches", err);
        }
    }

    static async sweep_unreported_outcomes() {
        try {
            const cut_off = new Date(Date.now() - RECONCILE_AFTER_MS);
            const issues = await prisma.issue.findMany({
                where: {
                    status: IssueStatus.InProgress,
                    agentDoneAt: { lt: cut_off },
                    assignerWorkerId: { not: null },
                },
                select: { id: true, number: true, assignerWorkerId: true },
            });

            if (issues.length === 0) return;

            for (const issue of issues) {
                const running = await guard_services.queue.has_active_dispatch(
                    issue.assignerWorkerId!,
                );
                if (running) continue;

                log.info("issue finished without a recorded outcome", { issue: issue.number });
                await guard_services.queue.enqueue_reconcile(issue.id);
            }
        } catch (err) {
            log.error("sweep failed: unreported outcomes", err);
        }
    }

    static async sweep_dead_worker_issues() {
        try {
            const cut_off = new Date(Date.now() - STUCK_DISPATCH_MS);
            const issues = await prisma.issue.findMany({
                where: {
                    status: IssueStatus.InProgress,
                    prUrl: null,
                    agentDoneAt: null,
                    updatedAt: { lt: cut_off },
                    assignedWorker: { status: WorkerStatus.Dead },
                },
                select: { id: true, number: true, projectId: true },
            });

            if (issues.length === 0) return;

            for (const issue of issues) {
                const successor = await prisma.worker.findFirst({
                    where: { projectId: issue.projectId, status: { not: WorkerStatus.Dead } },
                    orderBy: { updatedAt: "asc" },
                    select: { id: true },
                });

                if (!successor) {
                    log.warn("no live worker to take over unfinished issue", {
                        issue: issue.number,
                        project: issue.projectId,
                    });
                    continue;
                }

                await prisma.issue.updateMany({
                    where: { id: issue.id, status: IssueStatus.InProgress, prUrl: null },
                    data: { assignerWorkerId: successor.id },
                });
                log.info("reassigned issue held by a dead worker", {
                    issue: issue.number,
                    worker: successor.id,
                });
                await guard_services.queue.enqueue_dispatch(successor.id);
            }
        } catch (err) {
            log.error("sweep failed: dead worker issues", err);
        }
    }

    static async start_sweeper() {
        await Reconciler.sweep_stuck_routed_claims();
        await Reconciler.sweep_orphan_issues();
        await Reconciler.sweep_stuck_dispatches();
        await Reconciler.sweep_unreported_outcomes();
        await Reconciler.sweep_dead_worker_issues();
    }
}
